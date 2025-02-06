"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const syncUser = async () => {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!user) return;
    if (!userId) return;

    // check if user exists in the database

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    return dbUser;
  } catch (error) {
    console.error(error);
  }
};

export const getUserByClerkId = async (clerkId: string) => {
  return await prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
};

export const getDbUserId = async () => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);

  if (!user) return null;

  return user.id;
};

export const getRandomUsers = async () => {
  try {
    const userId = await getDbUserId();

    if (!userId) return [];

    const randomUser = await prisma.user.findMany({
      where: {
        NOT: {
          id: userId,
        },
      },
      take: 3,
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });
    return randomUser;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getRecommendedUsers = async () => {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    // Step 1: Find users that current user follows (A users)
    const followedByCurrentUser = await prisma.follows.findMany({
      where: { followerdId: userId },
      select: { followingId: true },
    });
    const aUserIds = followedByCurrentUser.map((f) => f.followingId);

    // Step 2: Find users that A users follow (B, C, D users)
    const recommendedUsers = await prisma.user.findMany({
      where: {
        // Users who are followed by A users
        followers: {
          some: {
            followerdId: {
              in: aUserIds,
            },
          },
        },
        // Exclude current user and users they already follow
        AND: {
          id: {
            notIn: [...aUserIds, userId],
          },
        },
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    return recommendedUsers;
  } catch (error) {
    console.error("Error getting recommended users:", error);
    return [];
  }
};

export const toggleFollow = async (targetUserId: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;
    if (userId === targetUserId) throw new Error("You can't follow yourself");

    // ვპოულობთ targetUser-ის სახელს
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true }, // ვიღებთ მომხმარებლის სახელს
    });

    if (!user) {
      return;
    }

    // ვამოწმებთ, უკვე მიჰყვება თუ არა მომხმარებელი
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerdId_followingId: {
          followerdId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // **Unfollow - წავშალოთ მონაცემი**
      await prisma.follows.delete({
        where: {
          followerdId_followingId: {
            followerdId: userId,
            followingId: targetUserId,
          },
        },
      });
      revalidatePath("/");
      return { success: true, message: `You unfollowed ${user.username}` };
    } else {
      // **Follow - დავამატოთ მონაცემი**
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerdId: userId,
            followingId: targetUserId,
          },
        }),
        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user who follows
          },
        }),
      ]);
      revalidatePath("/");
      return {
        success: true,
        message: `You are now following ${user.username}`,
      };
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error toggling follow" };
  }
};
