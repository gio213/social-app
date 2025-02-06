"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toggleFollow } from "@/actions/user.action";

interface FollowButtonProps {
  userId: string;
}

const FollowButton = ({ userId }: FollowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const result = await toggleFollow(userId);
      if (result?.success) {
        toast.success("Success", {
          description: result.message,
          closeButton: true,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed ", {
        description: "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size={"sm"}
      variant={"secondary"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-20"
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Follow"}
    </Button>
  );
};

export default FollowButton;
