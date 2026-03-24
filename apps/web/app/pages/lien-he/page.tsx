import Link from "next/link";
import ContactInfoPanel from "@/components/contact/ContactInfoPanel";
import ContactMap from "@/components/contact/ContactMap";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: `Liên hệ | ${siteConfig.name}`,
  description: `Thông tin liên hệ và hỗ trợ từ ${siteConfig.name}.`
};

export default function ContactPage() {
  return (
    <div className="layout-pageContact">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">{"Trang chủ"}</Link>
              </li>
              <li className="active">
                <strong>{"Liên hệ"}</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <div className="contact-inner">
        <div className="contact-map">
          <div className="map">
            <ContactMap />
          </div>
        </div>
        <div className="contact-body pb-16 pt-6">
          <div className="container">
            <div className="row">
              <div className="col-lg-6 col-md-12 col-12 column-left">
                <h2>{"Gửi thắc mắc cho chúng tôi"}</h2>
                <p>
                  {"Nếu bạn có thắc mắc, vui lòng gửi yêu cầu để chúng tôi liên hệ lại sớm nhất."}
                </p>
                <form className="contact-form">
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="input-group">
                        <input className="form-control" placeholder={"Tên của bạn"} />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="input-group">
                        <input className="form-control" placeholder={"Email của bạn"} />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="input-group">
                        <input className="form-control" placeholder={"Số điện thoại của bạn"} />
                      </div>
                    </div>
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="input-group">
                        <textarea className="form-control" placeholder={"Nội dung"} />
                      </div>
                    </div>
                    <div className="col-lg-12 col-md-12 col-12">
                      <button className="button" type="submit">
                        {"Gửi cho chúng tôi"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="col-lg-6 col-md-12 col-12 column-right">
                <h2>{"Thông tin liên hệ"}</h2>
                <ContactInfoPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
