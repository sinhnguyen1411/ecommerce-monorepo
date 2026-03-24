"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Pagination from "@/components/common/Pagination";

type NewsPaginationProps = {
  page: number;
  totalPages: number;
};

export default function NewsPagination({ page, totalPages }: NewsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-wrapper news-pagination">
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(nextPage) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("page", String(nextPage));
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
        }}
      />
    </div>
  );
}
