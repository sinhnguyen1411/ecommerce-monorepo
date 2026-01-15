"use client";

import { useState } from "react";
import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductTabs({ description }: { description?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Tabs
      defaultValue="description"
      className="border border-forest/10 bg-white p-6"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="description">Mô tả</TabsTrigger>
        <TabsTrigger value="return">Đổi trả</TabsTrigger>
        <TabsTrigger value="terms">Điều khoản</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="pt-4 text-sm text-ink/70">
        <div className={`${expanded ? "" : "max-h-48 overflow-hidden"}`}>
          {description ? (
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p>
              Sản phẩm được chọn lọc từ các nhà vườn đối tác, đảm bảo độ tươi mới và
              nguồn gốc rõ ràng.
            </p>
          )}
        </div>
        <button
          className="mt-4 text-sm font-semibold text-forest"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      </TabsContent>
      <TabsContent value="return" className="pt-4 text-sm text-ink/70">
        Đổi trả trong 24 giờ nếu sản phẩm không đạt chất lượng. Xem thêm tại{" "}
        <Link className="text-forest" href={siteConfig.policies.returnPolicy}>
          chính sách đổi trả
        </Link>
        .
      </TabsContent>
      <TabsContent value="terms" className="pt-4 text-sm text-ink/70">
        Đơn hàng được xác nhận khi TTC liên hệ hoặc nhận thanh toán thành công. Xem
        chi tiết tại{" "}
        <Link className="text-forest" href={siteConfig.policies.termsOfService}>
          điều khoản dịch vụ
        </Link>
        .
      </TabsContent>
    </Tabs>
  );
}
