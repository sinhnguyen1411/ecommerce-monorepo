import { redirect } from "next/navigation";

type BlogRedirectProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogRedirect({ params }: BlogRedirectProps) {
  const { slug } = await params;
  redirect(`/blogs/news/${slug}`);
}
