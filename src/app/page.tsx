import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import FollowToFollow from "@/components/FollowToFollow";
import PostCard from "@/components/PostCard";
import RecomendedUsers from "@/components/RecomendedUsers";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();
  const dbUserId = await getDbUserId();
  if (!user) return null;
  const posts = await getPosts();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} dbUserId={dbUserId} />
          ))}
        </div>
      </div>
      <div className="lg:block  hidden lg:col-span-4 sticky top-20">
        <FollowToFollow />
        <RecomendedUsers />
      </div>
    </div>
  );
}
