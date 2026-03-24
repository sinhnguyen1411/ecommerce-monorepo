import Link from "next/link";

export const metadata = {
  title: "Chính sách bảo mật | Nông Dược Tam Bố",
  description: "Quy định bảo mật thông tin khách hàng tại Tam Bố."
};

export default function PrivacyPolicyPage() {
  return (
    <div className="layout-pageDetail">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="active">
                <strong>Chính sách bảo mật</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-lg-9 col-md-8 col-12 column-left mg-page">
            <div className="wrapper-pageDetail">
              <div className="heading-pageDetail">
                <h1>Chính sách bảo mật</h1>
              </div>
              <div className="content-pageDetail typeList-style">
                <p>Nội dung đang được cập nhật.</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-4 col-12 column-right mg-page">
            <aside className="sidebar-page sticky-info" />
          </div>
        </div>
      </div>
    </div>
  );
}
