import { redirect } from "next/navigation";

type NewsPostRedirectProps = {
  params: {
    slug: string;
  };
};

export default function NewsPostRedirect({ params }: NewsPostRedirectProps) {
  redirect(`/blog/${params.slug}`);
}
