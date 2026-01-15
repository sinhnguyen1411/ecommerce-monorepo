"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const suggestions = ["Text 1", "Text 2", "Text 3"];

export default function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      return;
    }
    router.push(`/search?type=product&q=${encodeURIComponent(value)}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="header-action-btn" aria-label="Tìm kiếm">
          <Search className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="top-20 max-w-2xl translate-y-0 border border-forest/10 bg-white">
        <DialogHeader>
          <DialogTitle>Tìm kiếm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="field flex-1"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              name="q"
              maxLength={40}
            />
            <button className="btn-primary" type="submit">
              Tìm kiếm
            </button>
          </div>
          <div className="border border-forest/10 bg-white p-4 text-xs text-ink/70">
            Gợi ý cho bạn:{" "}
            {suggestions.map((item, index) => (
              <button
                key={item}
                type="button"
                className="text-forest hover:text-clay"
                onClick={() => setQuery(item)}
              >
                {item}
                {index < suggestions.length - 1 ? ", " : ""}
              </button>
            ))}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
