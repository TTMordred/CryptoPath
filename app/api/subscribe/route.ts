import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, language = 'vi' } = await request.json();

    if (!email) {
      const errorMessage = language === 'en' ? 'Email is required' : 'Email là bắt buộc';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Boolean(process.env.SMTP_SECURE) || false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@example.com',
        pass: process.env.SMTP_PASSWORD || 'your-password',
      },
      requireTLS: true,
    });

    // Email template based on language
    let subject, htmlContent;

    if (language === 'en') {
      subject = 'CryptoPath Subscription Confirmation';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://crypto-path.vercel.app/favicon.ico" alt="CryptoPath Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #F5B056; text-align: center;">Thank you for subscribing to CryptoPath!</h2>
          <p>Hello,</p>
          <p>Thank you for your interest in CryptoPath - Vietnam's leading crypto platform. We're excited to have you on board!</p>
          <p>In the coming days, you'll receive information about:</p>
          <ul>
            <li>CryptoPath's unique features</li>
            <li>Getting started with crypto</li>
            <li>Market news and updates</li>
            <li>Special offers for new users</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cryptopath.vn/download" style="background-color: #F5B056; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Download CryptoPath Now</a>
          </div>
          <p>If you have any questions, don't hesitate to contact us at <a href="mailto:cryptopath210@gmail.com">cryptopath210@gmail.com</a>.</p>
          <p>Best regards,<br>The CryptoPath Team</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
            <p>© ${new Date().getFullYear()} CryptoPath. All rights reserved.</p>
            <p>Our address: Vietnam</p>
            <p>
              <a href="https://cryptopath.vn/privacy-policy" style="color: #666; margin: 0 10px;">Privacy Policy</a> | 
              <a href="https://cryptopath.vn/terms" style="color: #666; margin: 0 10px;">Terms of Use</a> | 
              <a href="https://cryptopath.vn/unsubscribe?email=${email}" style="color: #666; margin: 0 10px;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `;
    } else { // Vietnamese (default)
      subject = 'Xác nhận đăng ký CryptoPath';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://crypto-path.vercel.app/favicon.ico" alt="CryptoPath Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #F5B056; text-align: center;">Cảm ơn bạn đã đăng ký CryptoPath!</h2>
          <p>Xin chào,</p>
          <p>Cảm ơn bạn đã quan tâm đến CryptoPath - nền tảng crypto hàng đầu Việt Nam. Chúng tôi rất vui mừng khi bạn đã tham gia cùng chúng tôi!</p>
          <p>Trong những ngày tới, bạn sẽ nhận được thông tin về:</p>
          <ul>
            <li>Các tính năng độc đáo của CryptoPath</li>
            <li>Hướng dẫn bắt đầu với crypto</li>
            <li>Tin tức và cập nhật về thị trường</li>
            <li>Ưu đãi đặc biệt dành cho người dùng mới</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cryptopath.vn/download" style="background-color: #F5B056; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Tải CryptoPath Ngay</a>
          </div>
          <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi tại <a href="mailto:cryptopath210@gmail.com">cryptopath210@gmail.com</a>.</p>
          <p>Trân trọng,<br>Đội ngũ CryptoPath</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
            <p>© ${new Date().getFullYear()} CryptoPath. Tất cả các quyền được bảo lưu.</p>
            <p>Địa chỉ của chúng tôi: Vietnam</p>
            <p>
              <a href="https://cryptopath.vn/privacy-policy" style="color: #666; margin: 0 10px;">Chính sách bảo mật</a> | 
              <a href="https://cryptopath.vn/terms" style="color: #666; margin: 0 10px;">Điều khoản sử dụng</a> | 
              <a href="https://cryptopath.vn/unsubscribe?email=${email}" style="color: #666; margin: 0 10px;">Hủy đăng ký</a>
            </p>
          </div>
        </div>
      `;
    }

    // Prepare and send email
    const mailOptions = {
      from: `"CryptoPath" <${process.env.SMTP_USER || 'info@cryptopath.vn'}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    // Success response based on language
    const successMessage = language === 'en' ? 'Subscription successful!' : 'Đăng ký thành công!';
    return NextResponse.json(
      { success: true, message: successMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing subscription:', error);
    
    // Error response based on language
    const { language = 'vi' } = await request.json().catch(() => ({ language: 'vi' }));
    const errorMessage = language === 'en' 
      ? 'An error occurred while processing your request.' 
      : 'Có lỗi xảy ra khi xử lý yêu cầu của bạn.';
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}