"use client";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2Icon, TriangleAlert } from "lucide-react";

export default function Custom404() {
  const router = useRouter();
  const profile = usePathname().includes("/profile");

  useEffect(() => {
    // Redirect to the homepage on mount
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000); // Redirect after 3 seconds

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen ">
      <TriangleAlert className="text-6xl text-red-500 mb-4" />
      <h1 className="text-4xl font-bold text-gray-800">
        {profile ? "Profile not found" : "Page not found"}
      </h1>
      <p className="text-lg text-gray-600">
        {profile
          ? "The profile you are looking for does not exist."
          : "The page you are looking for does not exist."}
      </p>
      <p className="text-lg text-gray-600">
        Redirecting you to the home page...
      </p>
      <Loader2Icon size={25} className="animate-spin" />
      <p className="text-sm text-gray-500">
        if you are not redirected automatically, please{" "}
        <Link href="/" className="text-blue-500 underline">
          Click here
        </Link>
        .
      </p>
    </div>
  );
}
