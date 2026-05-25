import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display text-xl font-bold text-gradient mb-4">UM Fashion</h3>
            <p className="text-sm text-gray-400">
              The future of fashion is here. AI-powered styling meets premium marketplace.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Shop</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link href="/shop/CLOTHING" className="block hover:text-white">Clothing</Link>
              <Link href="/shop/ACCESSORIES" className="block hover:text-white">Accessories</Link>
              <Link href="/shop/FRAGRANCES" className="block hover:text-white">Fragrances</Link>
              <Link href="/shop/MAKEUP" className="block hover:text-white">Makeup</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Account</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link href="/login" className="block hover:text-white">Sign In</Link>
              <Link href="/register" className="block hover:text-white">Register</Link>
              <Link href="/orders" className="block hover:text-white">Orders</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Sell</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link href="/register?vendor=true" className="block hover:text-white">Become a Vendor</Link>
              <Link href="/vendor" className="block hover:text-white">Vendor Dashboard</Link>
              <Link href="/gpu-setup" className="block hover:text-cyan-400">
                3D stylist — GPU laptop setup
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} UM Fashion. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
