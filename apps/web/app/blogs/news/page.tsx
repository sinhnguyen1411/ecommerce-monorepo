import Link from "next/link";

import PostCard from "@/components/blog/PostCard";
import PostSidebar from "@/components/blog/PostSidebar";
import { getPosts } from "@/lib/api";
import { stripHtml } from "@/lib/format";

export const metadata = {
  title: "Ki\u1EBFn th\u1EE9c nh\u00E0 n\u00F4ng | N\u00F4ng D\u01B0\u1EE3c Tam B\u1ED1",
  description:
    "C\u1EADp nh\u1EADt ki\u1EBFn th\u1EE9c nh\u00E0 n\u00F4ng, kinh nghi\u1EC7m canh t\u00E1c b\u1EC1n v\u1EEFng."
};

type NewsPageProps = {
  searchParams?: {
    tag?: string;
  };
};

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const activeTag = searchParams?.tag?.trim() || "";
  const allPosts = await getPosts();
  const posts = activeTag ? await getPosts({ tag: activeTag }) : allPosts;
  const featured = posts[0];
  const rest = posts.slice(1);
  const featuredExcerpt = featured
    ? stripHtml(featured.excerpt || featured.content || "").trim()
    : "";
  const topicSet = new Set<string>();
  allPosts.forEach((post) => {
    post.tags?.forEach((tag) => {
      if (tag) {
        topicSet.add(tag);
      }
    });
  });
  const topics = Array.from(topicSet).slice(0, 6);

  return (
    <section className="news-wrapper pb-16 pt-8">
      <div className="container">
        <div className="news-hero">
          <div className="news-hero__copy">
            <p className="news-hero__eyebrow">
              {"Ki\u1EBFn th\u1EE9c nh\u00E0 n\u00F4ng"}
            </p>
            <h1 className="news-hero__title">
              {"Ki\u1EBFn th\u1EE9c m\u00F9a v\u1EE5 v\u00E0 canh t\u00E1c b\u1EC1n v\u1EEFng"}
            </h1>
            <p className="news-hero__desc">
              {"C\u1EADp nh\u1EADt b\u00E0i vi\u1EBFt m\u1EDBi, kinh nghi\u1EC7m th\u1EF1c ti\u1EC5n v\u00E0 gi\u1EA3i ph\u00E1p k\u1EF9 thu\u1EADt cho n\u00F4ng nghi\u1EC7p h\u1EEFu c\u01A1."}
            </p>
            <div className="news-hero__actions">
              <Link href="/blogs/news" className="button">
                {"Xem b\u00E0i m\u1EDBi nh\u1EA5t"}
              </Link>
              <Link href="/pages/hoi-dap-cung-nha-nong" className="button btnlight">
                {"G\u1EEDi c\u00E2u h\u1ECFi"}
              </Link>
            </div>
          </div>
        </div>

        <div className="row news-content">
          <div className="col-lg-9 col-md-12 col-12 column-left mg-page">
            {featured ? (
              <article className="news-featured">
                <Link
                  href={"/blogs/news/" + featured.slug}
                  className="news-featured__media"
                >
                  {featured.cover_image ? (
                    <img src={featured.cover_image} alt={featured.title} />
                  ) : (
                    <div className="news-featured__empty">
                      {"\u1EA2nh b\u00E0i vi\u1EBFt \u0111ang c\u1EADp nh\u1EADt"}
                    </div>
                  )}
                </Link>
                <div className="news-featured__content">
                  <p className="news-featured__tag">
                    {"B\u00E0i vi\u1EBFt n\u1ED5i b\u1EADt"}
                  </p>
                  <h2 className="news-featured__title">
                    <Link href={"/blogs/news/" + featured.slug}>{featured.title}</Link>
                  </h2>
                  <p className="news-featured__desc">
                    {featuredExcerpt
                      ? featuredExcerpt
                      : "N\u1ED9i dung \u0111ang c\u1EADp nh\u1EADt."}
                  </p>
                </div>
              </article>
            ) : null}

            <div className="row blog-posts news-grid">
              {rest.length === 0 ? (
                <div className="blog-empty">
                  {"Ch\u01B0a c\u00F3 b\u00E0i vi\u1EBFt."}
                </div>
              ) : (
                rest.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
            <div className="news-cta">
              <div className="news-cta__card">
                <div>
                  <p className="news-cta__title">{"B\u1EA3n tin nh\u00E0 n\u00F4ng"}</p>
                  <p className="news-cta__text">
                    {"\u0110\u0103ng k\u00FD \u0111\u1EC3 nh\u1EADn ki\u1EBFn th\u1EE9c m\u1EDBi v\u00E0 \u01B0u \u0111\u00E3i theo m\u00F9a v\u1EE5."}
                  </p>
                </div>
                <div className="news-cta__form">
                  <input className="field" placeholder={"Email c\u1EE7a b\u1EA1n"} />
                  <button className="button">{"\u0110\u0103ng k\u00FD"}</button>
                </div>
              </div>
              <Link className="button btnlight" href="/collections/all">
                {"Mua s\u1EA3n ph\u1EA9m"}
              </Link>
            </div>
          </div>
          <div className="col-lg-3 col-md-12 col-12 column-right mg-page">
            <aside className="news-sidebar">
              <div className="news-hero__panel">
                <div className="news-hero__panel-title">
                  {"Ch\u1EE7 \u0111\u1EC1 n\u1ED5i b\u1EADt"}
                </div>
                <div className="news-topic-chips">
                  <Link
                    href="/blogs/news"
                    className={`news-topic-chip ${activeTag ? "" : "is-active"}`}
                  >
                    {"T\u1EA5t c\u1EA3"}
                  </Link>
                  {topics.length === 0 ? (
                    <>
                      <span className="news-topic-chip">
                        {"Canh t\u00E1c b\u1EC1n v\u1EEFng"}
                      </span>
                      <span className="news-topic-chip">
                        {"Dinh d\u01B0\u1EE1ng v\u00E0 c\u1EA3i t\u1EA1o \u0111\u1EA5t"}
                      </span>
                      <span className="news-topic-chip">
                        {"Ph\u00F2ng tr\u1EEB s\u00E2u b\u1EC7nh sinh h\u1ECDc"}
                      </span>
                    </>
                  ) : (
                    topics.map((topic) => (
                      <Link
                        key={topic}
                        href={`/blogs/news?tag=${encodeURIComponent(topic)}`}
                        className={`news-topic-chip ${activeTag === topic ? "is-active" : ""}`}
                      >
                        {topic}
                      </Link>
                    ))
                  )}
                </div>
                {activeTag ? (
                  <div className="news-topic-note">
                    {"\u0110ang l\u1ECDc theo ch\u1EE7 \u0111\u1EC1: "}
                    <strong>{activeTag}</strong>
                  </div>
                ) : null}
              </div>
              <div className="sidebar-blogs blogs-sticky">
                <PostSidebar posts={posts.slice(0, 5)} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
