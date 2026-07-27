import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  numeric,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ==================== CORE ====================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'motorista' | 'embarcador' | 'admin'
  company: varchar("company", { length: 160 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 2 }),
  vehicleType: varchar("vehicle_type", { length: 40 }),
  bodyType: varchar("body_type", { length: 40 }),
  plateNumber: varchar("plate_number", { length: 15 }),
  avatarUrl: varchar("avatar_url", { length: 300 }),
  bio: varchar("bio", { length: 500 }),
  credits: numeric("credits", { precision: 12, scale: 2 }),
  verified: boolean("verified").notNull().default(false),
  referralCode: varchar("referral_code", { length: 12 }).unique(),
  referredBy: integer("referred_by"), // FK removed to avoid circular type — enforced at app level
  invitedCount: integer("invited_count").notNull().default(0),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const freights = pgTable("freights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cargoType: varchar("cargo_type", { length: 120 }).notNull(),
  description: text("description"),
  originCity: varchar("origin_city", { length: 120 }).notNull(),
  originState: varchar("origin_state", { length: 2 }).notNull(),
  destCity: varchar("dest_city", { length: 120 }).notNull(),
  destState: varchar("dest_state", { length: 2 }).notNull(),
  distanceKm: integer("distance_km"),
  weightKg: integer("weight_kg").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }),
  priceType: varchar("price_type", { length: 20 }).notNull().default("total"), // 'total' | 'tonelada' | 'combinar'
  vehicleTypes: text("vehicle_types").notNull(), // csv
  bodyTypes: text("body_types").notNull(), // csv
  needsTracker: boolean("needs_tracker").notNull().default(false),
  needsTarp: boolean("needs_tarp").notNull().default(false),
  toll: boolean("toll").notNull().default(false), // pedágio incluso
  loadDate: varchar("load_date", { length: 20 }),
  contactName: varchar("contact_name", { length: 120 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ativo"), // 'ativo' | 'fechado' | 'cancelado'
  views: integer("views").notNull().default(0),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringFrequency: varchar("recurring_frequency", { length: 20 }), // 'semanal' | 'quinzenal' | 'mensal'
  delivered: boolean("delivered").notNull().default(false),
  deliveredAt: timestamp("delivered_at"),
  deliveredBy: integer("delivered_by"),
  isAuction: boolean("is_auction").notNull().default(false), // modo leilão?
  minPrice: numeric("min_price", { precision: 12, scale: 2 }), // preço mínimo se for leilão
  auctionEndsAt: timestamp("auction_ends_at"), // quando o leilão termina
  featured: boolean("featured").notNull().default(false), // destacado (pago)
  insuranceQuote: jsonb("insurance_quote"), // cotação de seguro armazenada
  trackingData: jsonb("tracking_data"), // dados de rastreamento
  trackingActive: boolean("tracking_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== PROPOSALS / BIDS ====================
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  freightId: integer("freight_id")
    .notNull()
    .references(() => freights.id, { onDelete: "cascade" }),
  driverId: integer("driver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  message: text("message"),
  status: varchar("status", { length: 20 }).notNull().default("pendente"), // pendente | aceita | recusada
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== FAVORITES ====================
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  freightId: integer("freight_id")
    .notNull()
    .references(() => freights.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== ALERTS ====================
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  originState: varchar("origin_state", { length: 2 }),
  destState: varchar("dest_state", { length: 2 }),
  vehicleType: varchar("vehicle_type", { length: 40 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== REVIEWS ====================
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  ratedUserId: integer("rated_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  punctuality: integer("punctuality"), // 1-5 extra
  communication: integer("communication"), // 1-5 extra
  paymentSpeed: integer("payment_speed"), // 1-5 extra
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== MESSAGES ====================
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  freightId: integer("freight_id")
    .references(() => freights.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== NOTIFICATIONS ====================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 30 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  link: varchar("link", { length: 200 }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== DOCUMENTS (verification) ====================
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  docType: varchar("doc_type", { length: 30 }).notNull(), // 'cnh' | 'rntc' | 'crvl' | 'cltm'
  fileUrl: varchar("file_url", { length: 300 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pendente"), // pendente | aprovado | rejeitado
  reviewComment: text("review_comment"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== TRANSACTIONS (credits) ====================
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(), // positivo = crédito, negativo = débito
  type: varchar("type", { length: 40 }).notNull(), // legado: referral_bonus, purchase, featured...
  description: varchar("description", { length: 200 }),
  refId: integer("ref_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== TRUCK ECONOMY ====================
export const truckWallets = pgTable("truck_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const truckLedger = pgTable("truck_ledger", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id")
    .notNull()
    .references(() => truckWallets.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  type: varchar("type", { length: 40 }).notNull(), // purchase, referral, featured, admin_grant, refund, bonus
  description: varchar("description", { length: 240 }).notNull(),
  referenceType: varchar("reference_type", { length: 40 }),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const truckProducts = pgTable("truck_products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 300 }),
  trucks: integer("trucks").notNull(),
  priceCents: integer("price_cents").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monetizationSettings = pgTable("monetization_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  value: jsonb("value").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  description: varchar("description", { length: 300 }),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billingOrders = pgTable("billing_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => truckProducts.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid, failed, refunded, canceled
  provider: varchar("provider", { length: 30 }).notNull().default("manual_beta"),
  providerReference: varchar("provider_reference", { length: 160 }),
  amountCents: integer("amount_cents").notNull(),
  trucks: integer("trucks").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  audience: varchar("audience", { length: 30 }).notNull(), // embarcador, transportadora, motorista
  priceCents: integer("price_cents").notNull(),
  interval: varchar("interval", { length: 20 }).notNull().default("month"),
  trucksIncluded: integer("trucks_included").notNull().default(0),
  features: jsonb("features").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id")
    .notNull()
    .references(() => subscriptionPlans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  provider: varchar("provider", { length: 30 }).default("manual_beta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== REFERRALS ====================
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  inviterId: integer("inviter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  invitedId: integer("invited_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | confirmed
  bonusAmount: numeric("bonus_amount", { precision: 12, scale: 2 }),
  creditedAt: timestamp("credited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== COMMUNITY POSTS ====================
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 30 }).notNull(), // dica | alerta | diesel | rodovia | mercado
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 2 }),
  imageUrl: varchar("image_url", { length: 400 }),
  likes: integer("likes").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id")
    .notNull()
    .references(() => postComments.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== FLEET MANAGEMENT ====================
export const fleets = pgTable("fleets", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fleetDrivers = pgTable("fleet_drivers", {
  id: serial("id").primaryKey(),
  fleetId: integer("fleet_id")
    .notNull()
    .references(() => fleets.id, { onDelete: "cascade" }),
  driverId: integer("driver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plateNumber: varchar("plate_number", { length: 15 }),
  vehicleType: varchar("vehicle_type", { length: 40 }),
  status: varchar("status", { length: 20 }).notNull().default("disponivel"), // disponivel | em_trânsito | manutencao
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// ==================== INSURANCE QUOTES ====================
export const insuranceQuotes = pgTable("insurance_quotes", {
  id: serial("id").primaryKey(),
  freightId: integer("freight_id")
    .notNull()
    .references(() => freights.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cargoValue: numeric("cargo_value", { precision: 12, scale: 2 }),
  distanceKm: integer("distance_km"),
  premium: numeric("premium", { precision: 12, scale: 2 }),
  coverage: varchar("coverage", { length: 30 }).notNull(), // basico | completo | premium
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== FISCAL DOCUMENTS (CT-e / MDF-e) ====================
export const fiscalDocuments = pgTable("fiscal_documents", {
  id: serial("id").primaryKey(),
  freightId: integer("freight_id")
    .notNull()
    .references(() => freights.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  docType: varchar("doc_type", { length: 10 }).notNull(), // cte | mdfe
  status: varchar("status", { length: 30 }).notNull().default("rascunho"), // rascunho | pronto_para_emitir | autorizado_simulado | cancelado
  accessKey: varchar("access_key", { length: 44 }),
  protocol: varchar("protocol", { length: 40 }),
  xmlContent: text("xml_content"),
  payload: jsonb("payload"),
  errorMessage: text("error_message"),
  issuedAt: timestamp("issued_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fiscalEvents = pgTable("fiscal_events", {
  id: serial("id").primaryKey(),
  fiscalId: integer("fiscal_id")
    .notNull()
    .references(() => fiscalDocuments.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 30 }).notNull(), // emissao | cancelamento | encerramento | carta_correcao | consulta
  protocol: varchar("protocol", { length: 40 }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== AUDIT & SESSIONS ====================
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  actorEmail: varchar("actor_email", { length: 160 }),
  action: varchar("action", { length: 60 }).notNull(),
  entity: varchar("entity", { length: 40 }),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  ip: varchar("ip", { length: 60 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 200 }).notNull().unique(),
  userAgent: varchar("user_agent", { length: 300 }),
  ip: varchar("ip", { length: 60 }),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const integrationSettings = pgTable("integration_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 40 }).notNull().default("geral"),
  label: varchar("label", { length: 160 }).notNull(),
  description: varchar("description", { length: 400 }),
  isSecret: boolean("is_secret").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(false),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trackingPositions = pgTable("tracking_positions", {
  id: serial("id").primaryKey(),
  freightId: integer("freight_id")
    .notNull()
    .references(() => freights.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  accuracy: numeric("accuracy", { precision: 8, scale: 2 }),
  speedKmh: numeric("speed_kmh", { precision: 6, scale: 2 }),
  heading: numeric("heading", { precision: 6, scale: 2 }),
  source: varchar("source", { length: 20 }).notNull().default("gps"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaUploads = pgTable("media_uploads", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 160 }).notNull().unique(),
  mimeType: varchar("mime_type", { length: 60 }).notNull(),
  dataBase64: text("data_base64").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== TYPES ====================
export type User = typeof users.$inferSelect;
export type Freight = typeof freights.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Fleet = typeof fleets.$inferSelect;
export type FleetDriver = typeof fleetDrivers.$inferSelect;
export type InsuranceQuote = typeof insuranceQuotes.$inferSelect;
export type FiscalDocument = typeof fiscalDocuments.$inferSelect;
export type TruckWallet = typeof truckWallets.$inferSelect;
export type TruckLedgerEntry = typeof truckLedger.$inferSelect;
export type TruckProduct = typeof truckProducts.$inferSelect;
export type MonetizationSetting = typeof monetizationSettings.$inferSelect;
export type BillingOrder = typeof billingOrders.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type CommentLike = typeof commentLikes.$inferSelect;
export type FiscalEvent = typeof fiscalEvents.$inferSelect;
export type MediaUpload = typeof mediaUploads.$inferSelect;
export type IntegrationSetting = typeof integrationSettings.$inferSelect;
export type TrackingPosition = typeof trackingPositions.$inferSelect;
