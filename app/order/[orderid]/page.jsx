export const metadata = {
  title: "🛍 Order Detail",
};

import OrderDetailPageClient from "./OrderDetailPageClient";

export default async function Page({ params }) {
  const { orderid } = await params;
  return <OrderDetailPageClient orderid={orderid} />;
}
