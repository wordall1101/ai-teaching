// app/philosophy/components/promotion-content.tsx
"use client";

export function PromotionContent() {
  return (
    <div className="promotion-content">
      <div className="promotion-header">
        <h3 className="promotion-title">致良知线上课堂</h3>
        <p className="promotion-subtitle">第68期诚意班报名中</p>
        <p className="promotion-tagline">免费公益 • 实修实证</p>
      </div>

      <div className="promotion-info">
        <div className="info-item">
          <span className="info-icon">🎓</span>
          <span>35天学习计划</span>
        </div>
        <div className="info-item">
          <span className="info-icon">📅</span>
          <span>11月9日开班</span>
        </div>
        <div className="info-item">
          <span className="info-icon">👨‍🏫</span>
          <span>博仁老师讲解</span>
        </div>
      </div>

      <div className="promotion-qrcode">
        <p className="qrcode-description">扫码报名免费学习</p>
        <div className="qrcode-image">
          <img
            alt="微信扫码报名致良知线上课堂"
            className="qrcode-img"
            height={180}
            src="/images/wechat-qrcode.png"
            width={180}
          />
        </div>
        <p className="qrcode-note">名额有限，欢迎加入</p>
      </div>
    </div>
  );
}
