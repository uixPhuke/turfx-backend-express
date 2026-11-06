import Razorpay from "razorpay";
import { PaymentGateway } from "./payment.service";
export function razorpayGateway(
  keyId: string,
  keySecret: string,
): PaymentGateway {
  const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  // SDK 2.9.x has no public timeout option; bound its per-client Axios transport.
  // Keep this adapter boundary covered when upgrading the pinned SDK.
  (
    client as unknown as { api: { rq: { defaults: { timeout: number } } } }
  ).api.rq.defaults.timeout = 15000;
  return {
    async createOrder(input) {
      const order = await client.orders.create(input);
      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    },
    async fetchPayment(id) {
      const payment = await client.payments.fetch(id);
      return {
        id: payment.id,
        order_id: payment.order_id || "",
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
      };
    },
    async findOrder(receipt) {
      const response = await client.orders.all({ receipt, count: 2 });
      if (response.items.length > 1)
        throw new Error("Multiple provider orders require operator review");
      const order = response.items[0];
      return order
        ? {
            id: order.id,
            amount: Number(order.amount),
            currency: order.currency,
          }
        : null;
    },
    async orderPayments(orderId) {
      const response = await client.orders.fetchPayments(orderId);
      return response.items.map((payment) => ({
        id: payment.id,
        order_id: payment.order_id || "",
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
      }));
    },
    async findRefund(paymentId, receipt) {
      // Paginate rather than assuming the requested refund is in the newest page.
      for (let skip = 0; skip < 10000; skip += 100) {
        const page = await client.payments.fetchMultipleRefund(paymentId, {
          count: 100,
          skip,
        });
        const found = page.items.find((item) => item.receipt === receipt);
        if (found)
          return {
            id: found.id,
            payment_id: found.payment_id,
            amount: Number(found.amount),
            status: found.status,
          };
        if (page.items.length < 100) return null;
      }
      throw new Error("Refund reconciliation page limit exceeded");
    },
    async refund(id, input) {
      const refund = await client.payments.refund(id, input);
      return { id: refund.id, status: refund.status };
    },
  };
}
