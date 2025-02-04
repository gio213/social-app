import { getRandomUsers, getRecomendedUsers } from "@/actions/user.action";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import FollowButton from "./FollowButton";
import Link from "next/link";

const FollowToFollow = async () => {
  const randomUser = await getRandomUsers();
  console.log("randomUser", randomUser);
  if (randomUser.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow to follow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {randomUser.map((user) => (
            <div
              key={user.id}
              className="flex gap-2 items-center justify-between "
            >
              <div className="flex items-center gap-1">
                <Link href={`/profile/${user.username}`}>
                  <Avatar>
                    <AvatarImage src={user.image ?? "/avatar.png"} />
                  </Avatar>
                </Link>
                <div className="text-xs">
                  <Link
                    href={`/profile/${user.username}`}
                    className="font-medium cursor-pointer"
                  >
                    {user.name}
                  </Link>
                  <p className="text-muted-foreground">@{user.username}</p>
                  <p className="text-muted-foreground">
                    {user._count.followers} followers
                  </p>
                </div>
              </div>
              <FollowButton userId={user.id} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowToFollow;
