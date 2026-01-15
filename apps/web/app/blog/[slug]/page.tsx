import { redirect } from "next/navigation";

type BlogRedirectProps = {
  params: {
    slug: string;
  };
};

export default function BlogRedirect({ params }: BlogRedirectProps) {
  redirect(`/blogs/news/${params.slug}`);
}
