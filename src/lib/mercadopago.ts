import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const ENV_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const ENV_PUBLIC_KEY = process.env.MP_PUBLIC_KEY || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Runtime credentials — can be overridden by admin settings in DB
let runtimeAccessToken = ENV_ACCESS_TOKEN;
let runtimePublicKey = ENV_PUBLIC_KEY;

export function setMPCredentials(accessToken: string, publicKey: string) {
  runtimeAccessToken = accessToken;
  runtimePublicKey = publicKey;
}

export function getMPCredentials() {
  return { accessToken: runtimeAccessToken, publicKey: runtimePublicKey };
}

export function isMPEnabled(): boolean {
  return Boolean(runtimeAccessToken && runtimePublicKey);
}

export function getMPPublicKey(): string {
  return runtimePublicKey;
}

let client: MercadoPagoConfig | null = null;
let preferenceClient: Preference | null = null;
let paymentClient: Payment | null = null;

function getClient(): MercadoPagoConfig {
  if (!client) client = new MercadoPagoConfig({ accessToken: runtimeAccessToken, options: { timeout: 5000 } });
  return client;
}

export interface CreatePreferenceInput {
  orderId: number;
  productName: string;
  productDescription?: string;
  amountCents: number;
  trucks: number;
  payerEmail: string;
  payerName?: string;
  successUrl?: string;
  pendingUrl?: string;
  failureUrl?: string;
  notificationUrl?: string;
  paymentMethods?: {
    excludedPaymentTypes?: string[];
    installments?: number;
    defaultInstallments?: number;
  };
}

export async function createMPPreference(input: CreatePreferenceInput) {
  if (!isMPEnabled()) throw new Error("Mercado Pago não configurado.");

  if (!preferenceClient) preferenceClient = new Preference(getClient());

  const preference = await preferenceClient.create({
    body: {
      external_reference: String(input.orderId),
      items: [{
        id: `trucks_${input.orderId}`,
        title: input.productName,
        description: input.productDescription || `${input.trucks} Trucks FreteTruck`,
        quantity: 1,
        unit_price: input.amountCents / 100,
        currency_id: "BRL",
      }],
      payer: {
        email: input.payerEmail,
        name: input.payerName || "",
      },
      back_urls: {
        success: input.successUrl || `${APP_URL}/trucks/sucesso`,
        pending: input.pendingUrl || `${APP_URL}/trucks/pendente`,
        failure: input.failureUrl || `${APP_URL}/trucks/falha`,
      },
      auto_return: "approved",
      notification_url: input.notificationUrl || `${APP_URL}/api/webhooks/mercadopago`,
      payment_methods: {
        default_payment_method_id: "pix",
        excluded_payment_types: input.paymentMethods?.excludedPaymentTypes?.map((t) => ({ id: t })),
        installments: input.paymentMethods?.installments || 12,
        default_installments: input.paymentMethods?.defaultInstallments || 1,
      },
      statement_descriptor: "FRETETRUCK",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  return {
    id: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  };
}

export async function getMPPayment(paymentId: string) {
  if (!isMPEnabled()) throw new Error("Mercado Pago não configurado.");
  if (!paymentClient) paymentClient = new Payment(getClient());
  const payment = await paymentClient.get({ id: paymentId });
  return {
    id: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    externalReference: payment.external_reference,
    paymentMethodId: payment.payment_method_id,
    transactionAmount: payment.transaction_amount,
    dateApproved: payment.date_approved,
  };
}

export { APP_URL };
