"use client"; // Ensures this runs on the client side
import Link from "next/link";

const Footer = () => {
    
    return(
      <footer className="bg-gradient-to-b from-black to-red-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Top Section: Logo & Newsletter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 text-center md:text-left">
          <Link href="/" className="text-3xl font-bold">
            Crypto<span className="text-[#F5B056]">Path<sub>&copy;</sub></span>
          </Link>
          <form className="mt-6 md:mt-0 flex flex-col sm:flex-row w-full sm:w-auto">
            <input
              type="email"
              placeholder="Subscribe to our newsletter"
              className="px-4 py-2 w-full sm:w-64 rounded-md sm:rounded-l-md text-gray-800 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#F5B056] text-gray-900 px-4 py-2 rounded-md sm:rounded-r-md hover:bg-yellow-500 transition mt-2 sm:mt-0 ml-1"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Middle Section: Navigation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center md:text-left mb-8">
          {/* About Us */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">About Us</h3>
            <ul className="space-y-2">
              <li><Link href="/aboutus" className="hover:text-red-400 transition">Our Story</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Team</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Careers</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Press</Link></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-red-400 transition">Buy Crypto</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">P2P Trading</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Trade</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Convert</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-red-400 transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Help Center</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">API Docs</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Support</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-red-400 transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-red-400 transition">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Social Links & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-700 pt-6 text-center">
          <p className="text-sm mb-4 md:mb-0">&copy; 2024 CryptoPath. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="https://facebook.com" className="hover:text-red-400 transition">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35C.6 0 0 .6 0 1.337v21.326C0 23.4.6 24 1.325 24H12.82v-9.294H9.692V11.41h3.127V8.805c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.794.715-1.794 1.763v2.313h3.587l-.467 3.297h-3.12V24h6.116c.725 0 1.325-.6 1.325-1.337V1.337C24 .6 23.4 0 22.675 0z"/>
              </svg>
            </Link>
            <Link href="https://twitter.com" className="hover:text-red-400 transition">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M24 4.557a9.83 9.83 0 0 1-2.828.775A4.932 4.932 0 0 0 23.337 3.1a9.865 9.865 0 0 1-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.728 0-4.942 2.208-4.942 4.927 0 .386.045.762.127 1.124C7.728 8.86 4.1 6.81 1.671 3.885a4.93 4.93 0 0 0-.666 2.475c0 1.706.87 3.213 2.19 4.096a4.904 4.904 0 0 1-2.236-.616v.062c0 2.385 1.693 4.374 3.946 4.827a4.935 4.935 0 0 1-2.224.085c.626 1.956 2.444 3.379 4.6 3.418A9.868 9.868 0 0 1 0 19.54a13.944 13.944 0 0 0 7.548 2.212c9.058 0 14.01-7.513 14.01-14.01 0-.213-.005-.426-.014-.637A10.012 10.012 0 0 0 24 4.557z"/>
              </svg>
            </Link>
            <Link href="https://instagram.com" className="hover:text-red-400 transition">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.96.24 2.406.403.58.22 1 .48 1.44.92.44.44.7.86.92 1.44.163.446.35 1.236.403 2.406.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.96-.403 2.406-.22.58-.48 1-.92 1.44-.44.44-.86.7-1.44.92-.446.163-1.236.35-2.406.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.96-.24-2.406-.403-.58-.22-1-.48-1.44-.92-.44-.44-.7-.86-.92-1.44-.163-.446-.35-1.236-.403-2.406-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.24-1.96.403-2.406.22-.58.48-1 1.44-.92.44-.44.86-.7 1.44-.92.446-.163 1.236-.35 2.406-.403C8.416 2.175 8.796 2.163 12 2.163m0-2.163C8.736 0 8.332.012 7.052.07 5.773.128 4.675.332 3.783.703c-.935.38-1.725.885-2.516 1.676C.332 3.9.128 4.99.07 6.268.012 7.548 0 7.952 0 11.215s.012 3.668.07 4.948c.058 1.278.262 2.368.633 3.26.38.935.885 1.725 1.676 2.516.791.791 1.581 1.296 2.516 1.676.892.371 1.982.575 3.26.633 1.28.058 1.684.07 4.948.07s3.668-.012 4.948-.07c1.278-.058 2.368-.262 3.26-.633.935-.38 1.725-.885 2.516-1.676.791-.791 1.296-1.581 1.676-2.516.371-.892.575-1.982.633-3.26.058-1.28.07-1.684.07-4.948s-.012-3.668-.07-4.948c-.058-1.278-.262-2.368-.633-3.26-.38-.935-.885-1.725-1.676-2.516C20.268.885 19.478.38 18.543 0c-.892-.371-1.982-.575-3.26-.633C15.668.012 15.264 0 12 0z" />
                <path d="M12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998z" />
                <circle cx="18.406" cy="5.594" r="1.44" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
    )
}
export default Footer;
