```bash

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // url      = env("DATABASE_URL")
}

model User {
  id                    String                @id @default(uuid())
  email                 String                @unique
  password              String
  phone                 String?               @unique
  dob                   DateTime?
  bio                   String?
  gender                String?
  country               String?
  profilePicture        String?
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  agencyId              String?
  diamond               Int                   @default(0)
  gold                  Int                   @default(0)
  isAccountBlocked      Boolean               @default(false)
  isDiamondBlocked      Boolean               @default(false)
  isGoldBlocked         Boolean               @default(false)
  isHost                Boolean               @default(false)
  isReseller            Boolean               @default(false)
  vipId                 String?
  nickName              String                @default("Unknown")
  roleId                String?
  charmLevelId          String?
  wealthLevelId         String?
  coverImage            String?
  activeItemId          String?
  activityLog           ActivityLog[]
  backpack              Backpack[]
  blockedBy             Block[]               @relation("UserBlocked")
  blocking              Block[]               @relation("UserBlocking")
  UserGallery           CoverPhoto[]
  following             Follow[]              @relation("UserFollowing")
  followers             Follow[]              @relation("UserFollowers")
  receivedFriends       Friends[]             @relation("ReceivedFriends")
  requestedFriends      Friends[]             @relation("RequestedFriends")
  loginHistory          LoginHistory[]
  refreshTokens         RefreshToken[]
  sessions              Session[]
  activeItem            StoreItem?            @relation("UserActiveItem", fields: [activeItemId], references: [id])
  charmLevel            CharmLevel?           @relation("UserCharmLevel", fields: [charmLevelId], references: [id])
  wealthLevel           WealthLevel?          @relation("UserWealthLevel", fields: [wealthLevelId], references: [id])
  agency                Agency?               @relation(fields: [agencyId], references: [id], map: "user_agency_fk")
  vip                   Vip?                  @relation(fields: [vipId], references: [id], map: "user_vip_fk")
  deactivation          UserDeactivation?
  visitors              Visitors[]            @relation("UserVisitors")
  VoiceRoom             VoiceRoom[]
  coinSellers           CoinSeller[]
  coinsSellingHistories CoinsSellingHistory[]
}

model Session {
  id           String    @id @default(uuid())
  userId       String
  createdAt    DateTime  @default(now())
  expiresAt    DateTime?
  lastAccessed DateTime?
  country      String?
  deviceId     String?
  ipAddress    String?
  userAgent    String?
  user         User      @relation(fields: [userId], references: [id])

  @@index([userId])
}

model LoginHistory {
  id        String   @id @default(uuid())
  userId    String
  ip        String?
  country   String?
  deviceId  String?
  userAgent String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model CoverPhoto {
  id        String   @id @default(uuid())
  userId    String
  url       String
  orderIdx  Int      @default(0)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([userId, orderIdx])
}

model Agency {
  id            String   @id @default(uuid())
  name          String
  ownerId       String
  code          String   @unique
  level         String
  description   String
  logoUrl       String
  country       String
  totalMembers  Int
  totalEarnings BigInt
  balance       BigInt
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  users         User[]
}

model Vip {
  id             String   @id @default(uuid())
  name           String
  type           String
  privilegeId    String
  validity       Int
  amount         Int
  imageUrl       String
  entryAnimation String
  profileFrame   String
  purchaseDate   DateTime
  expiryDate     DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  users          User[]
}

model EmailOtp {
  id        String   @id @default(uuid())
  email     String
  otp       String
  purpose   String
  expiresAt DateTime
  consumed  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([email])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String
  userId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model CharmLevel {
  id            String @id @default(uuid())
  name          String
  imageUrl      String
  levelup_point Int
  users         User[] @relation("UserCharmLevel")
}

model WealthLevel {
  id            String @id @default(uuid())
  name          String
  imageUrl      String
  levelup_point Int
  users         User[] @relation("UserWealthLevel")
}

model Follow {
  id         String   @id @default(uuid())
  userId     String
  followerId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  follower   User     @relation("UserFollowing", fields: [followerId], references: [id])
  user       User     @relation("UserFollowers", fields: [userId], references: [id])

  @@unique([userId, followerId])
  @@index([userId])
  @@index([followerId])
}

model Friends {
  id          String       @id @default(uuid())
  requesterId String
  receiverId  String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  status      FriendStatus @default(PENDING)
  receiver    User         @relation("ReceivedFriends", fields: [receiverId], references: [id])
  requester   User         @relation("RequestedFriends", fields: [requesterId], references: [id])

  @@unique([requesterId, receiverId])
  @@index([requesterId])
  @@index([receiverId])
}

model Visitors {
  id        String   @id @default(uuid())
  userId    String
  visitorId String
  createdAt DateTime @default(now())
  user      User     @relation("UserVisitors", fields: [userId], references: [id])

  @@index([userId])
}

model Block {
  id        String   @id @default(uuid())
  blockerId String
  blockedId String
  createdAt DateTime @default(now())
  blocked   User     @relation("UserBlocked", fields: [blockedId], references: [id])
  blocker   User     @relation("UserBlocking", fields: [blockerId], references: [id])

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
}

model ActivityLog {
  id         String   @id @default(uuid())
  userId     String
  action     String
  targetId   String?
  targetType String?
  metadata   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
}

model UserDeactivation {
  id            String    @id @default(uuid())
  userId        String    @unique
  reason        String?
  feedback      String?
  deactivatedAt DateTime  @default(now())
  reactivatedAt DateTime?
  user          User      @relation(fields: [userId], references: [id])

  @@index([userId])
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model StoreCategory {
  id    String      @id @default(uuid())
  name  String
  icon  String
  items StoreItem[]
}

model StoreItem {
  id          String        @id @default(uuid())
  categoryId  String
  name        String
  price       Int
  icon        String
  type        String
  validity    DateTime?
  createdAt   DateTime      @default(now())
  backpacks   Backpack[]
  category    StoreCategory @relation(fields: [categoryId], references: [id])
  activeUsers User[]        @relation("UserActiveItem")
}

model Backpack {
  id         String    @id @default(uuid())
  userId     String
  itemId     String
  quantity   Int       @default(1)
  acquiredAt DateTime  @default(now())
  item       StoreItem @relation(fields: [itemId], references: [id])
  user       User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([itemId])
}

model Employee {
  id             String       @id @default(uuid())
  name           String
  email          String       @unique
  phone          String?      @unique
  password       String
  profilePicture String?
  role           EmployeeRole @default(STAFF)
}

model CoinSeller {
  id        String   @id @default(uuid())
  userId    String
  totalCoin Int
  status    String
  createdAt DateTime @default(now())

  user           User                  @relation(fields: [userId], references: [id])
  sellingHistory CoinsSellingHistory[]
  buyingHistory  CoinsBuyingHistory[]
}

model CoinsSellingHistory {
  id         String   @id @default(uuid())
  sellerId   String
  receiverId String
  status     String
  amount     Int
  createdAt  DateTime @default(now())

  seller   CoinSeller @relation(fields: [sellerId], references: [id])
  receiver User       @relation(fields: [receiverId], references: [id])
}

model CoinsBuyingHistory {
  id        String   @id @default(uuid())
  sellerId  String
  amount    Int
  status    String
  createdAt DateTime @default(now())

  seller CoinSeller @relation(fields: [sellerId], references: [id])
}

model VoiceRoom {
  id                   String                 @id
  name                 String                 @unique
  hostId               String
  locked               Boolean                @default(false)
  createdAt            DateTime               @default(now())
  User                 User                   @relation(fields: [hostId], references: [id])
  VoiceRoomBan         VoiceRoomBan[]
  VoiceRoomEvent       VoiceRoomEvent[]
  VoiceRoomParticipant VoiceRoomParticipant[]
  VoiceRoomSeat        VoiceRoomSeat[]
  VoiceRoomSeatRequest VoiceRoomSeatRequest[]
  VoiceRoomTokenLog    VoiceRoomTokenLog[]
}

model VoiceRoomBan {
  id        String    @id
  roomId    String
  userId    String
  createdAt DateTime  @default(now())
  VoiceRoom VoiceRoom @relation(fields: [roomId], references: [id])

  @@unique([roomId, userId])
}

model VoiceRoomEvent {
  id        String    @id
  roomId    String
  userId    String?
  action    String
  createdAt DateTime  @default(now())
  VoiceRoom VoiceRoom @relation(fields: [roomId], references: [id])
}

model VoiceRoomParticipant {
  id        String    @id
  roomId    String
  userId    String
  joinedAt  DateTime  @default(now())
  micOn     Boolean   @default(false)
  role      String    @default("LISTENER")
  VoiceRoom VoiceRoom @relation(fields: [roomId], references: [id])

  @@unique([roomId, userId])
  @@index([roomId])
}

model VoiceRoomSeat {
  id         String    @id
  roomId     String
  seatNumber Int
  userId     String?
  micOn      Boolean   @default(false)
  locked     Boolean   @default(false)
  VoiceRoom  VoiceRoom @relation(fields: [roomId], references: [id])

  @@unique([roomId, seatNumber])
  @@index([roomId])
}

model VoiceRoomSeatRequest {
  id        String    @id
  roomId    String
  userId    String
  status    String    @default("PENDING")
  createdAt DateTime  @default(now())
  VoiceRoom VoiceRoom @relation(fields: [roomId], references: [id])

  @@index([roomId])
}

model VoiceRoomTokenLog {
  id        String    @id
  roomId    String
  userId    String
  provider  String
  token     String
  expireAt  DateTime
  createdAt DateTime  @default(now())
  VoiceRoom VoiceRoom @relation(fields: [roomId], references: [id])

  @@index([roomId])
}

enum FriendStatus {
  PENDING
  ACCEPTED
  REJECTED
  CANCELLED
}

enum EmployeeRole {
  ADMIN
  MANAGER
  STAFF
}


```
