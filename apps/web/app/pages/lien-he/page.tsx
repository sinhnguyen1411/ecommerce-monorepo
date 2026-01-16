import { siteConfig } from "@/lib/site";

export const metadata = {
  title: `Liên hệ | ${siteConfig.name}`,
  description: `Thông tin liên hệ và hỗ trợ từ ${siteConfig.name}.`
};

export default function ContactPage() {
  const phoneLabel = `${siteConfig.phone} - ${siteConfig.fax}`;
  const mapSrc =
    "https://www.google.com/maps?q=11.6216306,108.2261405&hl=vi&z=16&output=embed";

  return (
    <div className="layout-pageContact">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <a href="/" target="_self">
                  Trang chủ
                </a>
              </li>
              <li className="active">
                <strong>LIÊN HỆ</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <div className="contact-inner">
        <div className="contact-map">
          <div className="map">
            <iframe
              src={mapSrc}
              width="100%"
              height="450"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
        <div className="contact-body pb-16 pt-6">
          <div className="container">
            <div className="row">
              <div className="col-lg-6 col-md-12 col-12 column-left">
                <h2>Gửi thắc mắc cho chúng tôi</h2>
                <p>
                  Nếu bạn có thắc mắc, vui lòng gửi yêu cầu để chúng tôi liên hệ lại
                  sớm nhất.
                </p>
                <form className="contact-form">
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="input-group">
                        <input className="form-control" placeholder="Tên của bạn" />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="input-group">
                        <input className="form-control" placeholder="Email của bạn" />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="input-group">
                        <input
                          className="form-control"
                          placeholder="Số điện thoại của bạn"
                        />
                      </div>
                    </div>
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="input-group">
                        <textarea className="form-control" placeholder="Nội dung" />
                      </div>
                    </div>
                    <div className="col-lg-12 col-md-12 col-12">
                      <button className="button" type="submit">
                        Gửi cho chúng tôi
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="col-lg-6 col-md-12 col-12 column-right">
                <h2>Thông tin liên hệ</h2>
                <div className="contact-info">
                  <div className="contact-info__list">
                    <div className="contact-info__item">
                      <div className="left">
                        <span className="icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 368.16 368.16">
                            <path d="M184.08,0c-74.992,0-136,61.008-136,136c0,24.688,11.072,51.24,11.536,52.36c3.576,8.488,10.632,21.672,15.72,29.4l93.248,141.288c3.816,5.792,9.464,9.112,15.496,9.112s11.68-3.32,15.496-9.104l93.256-141.296c5.096-7.728,12.144-20.912,15.72-29.4c0.464-1.112,11.528-27.664,11.528-52.36C320.08,61.008,259.072,0,184.08,0z M293.8,182.152c-3.192,7.608-9.76,19.872-14.328,26.8l-93.256,141.296c-1.84,2.792-2.424,2.792-4.264,0L88.696,208.952c-4.568-6.928-11.136-19.2-14.328-26.808C74.232,181.816,64.08,157.376,64.08,136c0-66.168,53.832-120,120-120c66.168,0,120,53.832,120,120C304.08,157.408,293.904,181.912,293.8,182.152z"></path>
                            <path d="M184.08,64.008c-39.704,0-72,32.304-72,72c0,39.696,32.296,72,72,72c39.704,0,72-32.304,72-72C256.08,96.312,223.784,64.008,184.08,64.008z M184.08,192.008c-30.872,0-56-25.12-56-56s25.128-56,56-56s56,25.12,56,56S214.952,192.008,184.08,192.008z"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="right">
                        <strong>Địa chỉ</strong>
                        <br />
                        {siteConfig.address}
                      </div>
                    </div>
                    <div className="contact-info__item">
                      <div className="left">
                        <span className="icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 482.6 482.6">
                            <path d="M98.339,320.8c47.6,56.9,104.9,101.7,170.3,133.4c24.9,11.8,58.2,25.8,95.3,28.2c2.3,0.1,4.5,0.2,6.8,0.2c24.9,0,44.9-8.6,61.2-26.3c0.1-0.1,0.3-0.3,0.4-0.5c5.8-7,12.4-13.3,19.3-20c4.7-4.5,9.5-9.2,14.1-14c21.3-22.2,21.3-50.4-0.2-71.9l-60.1-60.1c-10.2-10.6-22.4-16.2-35.2-16.2c-12.8,0-25.1,5.6-35.6,16.1l-35.8,35.8c-3.3-1.9-6.7-3.6-9.9-5.2c-4-2-7.7-3.9-11-6c-32.6-20.7-62.2-47.7-90.5-82.4c-14.3-18.1-23.9-33.3-30.6-48.8c9.4-8.5,18.2-17.4,26.7-26.1c3-3.1,6.1-6.2,9.2-9.3c10.8-10.8,16.6-23.3,16.6-36s-5.7-25.2-16.6-36l-29.8-29.8c-3.5-3.5-6.8-6.9-10.2-10.4c-6.6-6.8-13.5-13.8-20.3-20.1c-10.3-10.1-22.4-15.4-35.2-15.4c-12.7,0-24.9,5.3-35.6,15.5l-37.4,37.4c-13.6,13.6-21.3,30.1-22.9,49.2c-1.9,23.9,2.5,49.3,13.9,80C32.739,229.6,59.139,273.7,98.339,320.8z"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="right">
                        <strong>Điện thoại</strong>
                        <br />
                        {phoneLabel}
                      </div>
                    </div>
                    <div className="contact-info__item">
                      <div className="left">
                        <span className="icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 512 512">
                            <path d="M469.333,64H42.667C19.135,64,0,83.135,0,106.667v298.667C0,428.865,19.135,448,42.667,448h426.667C492.865,448,512,428.865,512,405.333V106.667C512,83.135,492.865,64,469.333,64z M42.667,85.333h426.667c1.572,0,2.957,0.573,4.432,0.897c-36.939,33.807-159.423,145.859-202.286,184.478c-3.354,3.021-8.76,6.625-15.479,6.625s-12.125-3.604-15.49-6.635C197.652,232.085,75.161,120.027,38.228,86.232C39.706,85.908,41.094,85.333,42.667,85.333z"></path>
                            <path d="M21.333,405.333V106.667c0-2.09,0.63-3.986,1.194-5.896c28.272,25.876,113.736,104.06,169.152,154.453C136.443,302.671,50.957,383.719,22.46,410.893C21.957,409.079,21.333,407.305,21.333,405.333z"></path>
                            <path d="M469.333,426.667H42.667c-1.704,0-3.219-0.594-4.81-0.974c29.447-28.072,115.477-109.586,169.742-156.009c7.074,6.417,13.536,12.268,18.63,16.858c8.792,7.938,19.083,12.125,29.771,12.125s20.979-4.188,29.76-12.115c5.096-4.592,11.563-10.448,18.641-16.868c54.268,46.418,140.286,127.926,169.742,156.009C472.552,426.073,471.039,426.667,469.333,426.667z"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="right">
                        <strong>Thời gian làm việc</strong>
                        <br />
                        Tất cả các ngày trong tuần
                      </div>
                    </div>
                    <div className="contact-info__item">
                      <div className="left">
                        <span className="icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 368 368">
                            <path d="M184,60c4.4,0,8-3.6,8-8v-4c0-4.4-3.6-8-8-8c-4.4,0-8,3.6-8,8v4C176,56.4,179.6,60,184,60z"></path>
                            <path d="M184,308c-4.4,0-8,3.6-8,8v4c0,4.4,3.6,8,8,8c4.4,0,8-3.6,8-8v-4C192,311.6,188.4,308,184,308z"></path>
                            <path d="M52,176h-4c-4.4,0-8,3.6-8,8c0,4.4,3.6,8,8,8h4c4.4,0,8-3.6,8-8C60,179.6,56.4,176,52,176z"></path>
                            <path d="M320,176h-4c-4.4,0-8,3.6-8,8c0,4.4,3.6,8,8,8h4c4.4,0,8-3.6,8-8C328,179.6,324.4,176,320,176z"></path>
                            <path d="M93.6,82.4c-3.2-3.2-8-3.2-11.2,0c-3.2,3.2-3.2,8,0,11.2l2.8,2.8c1.6,1.6,3.6,2.4,5.6,2.4s4-0.8,5.6-2.4c3.2-3.2,3.2-8,0-11.2L93.6,82.4z"></path>
                            <path d="M85.2,271.6l-2.8,2.8c-3.2,3.2-3.2,8,0,11.2C84,287.2,86,288,88,288s4-0.8,5.6-2.4l2.8-2.8c3.2-3.2,3.2-8,0-11.2S88.4,268.4,85.2,271.6z"></path>
                            <path d="M274.4,82.4l-2.8,2.8c-3.2,3.2-3.2,8,0,11.2c1.6,1.6,3.6,2.4,5.6,2.4s4-0.8,5.6-2.4l2.8-2.8c3.2-3.2,3.2-8,0-11.2C282.4,79.2,277.6,79.2,274.4,82.4z"></path>
                            <path d="M192,180.8V108c0-4.4-3.6-8-8-8c-4.4,0-8,3.6-8,8v76c0,2,0.8,4,2.4,5.6l87.6,87.6c1.6,1.6,3.6,2.4,5.6,2.4s4-0.8,5.6-2.4c3.2-3.2,3.2-8,0-11.2L192,180.8z"></path>
                            <path d="M184,0C82.4,0,0,82.4,0,184s82.4,184,184,184s184-82.4,184-184S285.6,0,184,0z M184,352c-92.8,0-168-75.2-168-168S91.2,16,184,16s168,75.2,168,168S276.8,352,184,352z"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="right">
                        <strong>Email</strong>
                        <br />
                        {siteConfig.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
