import SectionTitle from "@/components/common/SectionTitle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getQnA } from "@/lib/api";

export const metadata = {
  title: "Hoi dap | Nong Nghiep TTC",
  description: "Tong hop cau hoi thuong gap ve san pham va giao hang."
};

export default async function QnAPage() {
  const items = await getQnA();

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Hoi dap"
          title="Hoi dap cung nha nong"
          description="Tong hop cau hoi thuong gap ve don hang, giao hang va nguon nong san."
        />
      </section>

      <section className="section-shell pb-16">
        {items.length === 0 ? (
          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6 text-sm text-ink/70">
            Chua co cau hoi.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {items.map((item) => (
              <AccordionItem
                key={item.id}
                value={`qna-${item.id}`}
                className="rounded-[24px] border border-forest/10 bg-white/90 px-4"
              >
                <AccordionTrigger className="text-left text-base font-semibold">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-ink/70">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </div>
  );
}
