import { TriangleAlert } from "lucide-react";
import Link from "next/link";

export function NoReadwiseAccessToken() {
  return (
    <div className="p-8">
      <div className="flex items-center mb-4">
        <TriangleAlert className="mr-2" />
        <h2 className="text-xl font-bold">No API token found</h2>
      </div>
      <p className="">
        Please add your Readwise API token in{" "}
        <Link
          href="/settings"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          the Settings
        </Link>{" "}
        to continue.
      </p>
    </div>
  );
}
