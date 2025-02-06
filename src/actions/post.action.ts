"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export const createPost = async (content: string, image: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;
    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });
    revalidatePath("/");
    return { success: true, post };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Faild to create post" };
  }
};

export const getPosts = async () => {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    // Find users that the current user follows
    const followingUsers = await prisma.follows.findMany({
      where: { followerdId: userId },
      select: { followingId: true },
    });

    // Convert array of objects to array of IDs
    const followingIds = followingUsers.map((f) => f.followingId);

    followingIds.push(userId); // Include current user's posts

    // Fetch posts only from followed users
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: followingIds }, // Only posts from followed users
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get posts");
  }
};

export const toggleLike = async (postId: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    // check if like exists

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // unlike
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId,
                  creatorId: userId,
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to like post" };
  }
};

export const createComment = async (postId: string, content: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    if (!content) throw new Error("Comment can't be empty");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    // create comment notification in a transaction

    const comment = await prisma.$transaction(async (tx) => {
      // create comment first
      const newComment = await tx.comment.create({
        data: {
          content,
          postId,
          authorId: userId,
        },
      });

      // create notification
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }
      return newComment;
    });
    revalidatePath("/");
    return { success: true, comment };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to add comment" };
  }
};

export const updateComment = async (commentId: string, content: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;
    if (!content) throw new Error("Comment can't be empty");
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== userId)
      throw new Error("Unauthorized-no update permission");
    await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
    revalidatePath("/");
    return { success: true, message: "Comment updated" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update comment" };
  }
};

export const deletePost = async (postId: string) => {
  try {
    const userId = await getDbUserId();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId)
      throw new Error("Unauthorized-no delete permission");
    await prisma.post.delete({
      where: { id: postId },
    });
    revalidatePath("/");
    return { success: true, message: "Post deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to delete post" };
  }
};
