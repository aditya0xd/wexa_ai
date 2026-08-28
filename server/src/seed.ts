/**
 * Seed Data Script for FRTB Counterparty Contagion Simulator
 *
 * Populates CognoDB with a realistic financial network:
 * - Institutions (Tier1, Tier2, Tier3 banks, hedge funds, brokers, insurers, corporates)
 * - Collateral pools (Corporate Bonds, Sovereign, Equities, MBS)
 * - Trading relationships (TRADES_WITH) with exposure amounts
 * - Collateral postings (POSTS_COLLATERAL)
 * - Ownership links (OWNED_BY) for systemic interconnectivity
 *
 * Key Design:
 * 1. Idempotent via MERGE — safe to run repeatedly without creating duplicates.
 * 2. Realistic exposures ($1M–$100M+ per trade).
 * 3. Integrates with existing app config & driver lifecycle.
 */

import type { Driver, Session } from "neo4j-driver";
import { getDriver, pingDatabaseOnStartup, closeDriver } from "./db/driver.js";
import { logger } from "./utils/logger.js";

interface SeedContext {
  driver: Driver;
  session: Session;
  stats: {
    institutionsCreated: number;
    poolsCreated: number;
    tradesCreated: number;
    collateralCreated: number;
    ownershipCreated: number;
    startTime: number;
  };
}

/**
 * Clear existing graph data before seeding
 */
async function clearDatabase(ctx: SeedContext): Promise<void> {
  logger.info("🗑️  Clearing existing data (MATCH (n) DETACH DELETE n)...");
  await ctx.session.executeWrite(async (tx) => {
    await tx.run("MATCH (n) DETACH DELETE n");
  });
  logger.info("✅ Database cleared.");
}

/**
 * Seed Institutions (Tier1, Tier2, Tier3, Hedge Funds, Brokers, Insurers, Corporates)
 */
async function seedInstitutions(ctx: SeedContext): Promise<void> {
  logger.info("🏦 Seeding Institutions...");

  const institutions = [
    // ─── Tier 1 (Systemically Important Banks) ─────────────────────
    {
      id: "BANK_GS",
      name: "Goldman Sachs",
      type: "Bank",
      tier: "Tier1",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "BANK_JPM",
      name: "JPMorgan Chase",
      type: "Bank",
      tier: "Tier1",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "BANK_BNY",
      name: "BNY Mellon",
      type: "Bank",
      tier: "Tier1",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "BANK_DB",
      name: "Deutsche Bank",
      type: "Bank",
      tier: "Tier1",
      country: "Germany",
      status: "Healthy",
    },
    {
      id: "BANK_HSBC",
      name: "HSBC Holdings",
      type: "Bank",
      tier: "Tier1",
      country: "UK",
      status: "Healthy",
    },
    {
      id: "BANK_CS",
      name: "Credit Suisse",
      type: "Bank",
      tier: "Tier1",
      country: "Switzerland",
      status: "Stressed", // Intentional: stressed institution for contagion demonstration
    },

    // ─── Tier 2 (Regional Systemic Banks) ──────────────────────────
    {
      id: "BANK_BOA",
      name: "Bank of America",
      type: "Bank",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "BANK_WF",
      name: "Wells Fargo",
      type: "Bank",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "BANK_SOCGEN",
      name: "Société Générale",
      type: "Bank",
      tier: "Tier2",
      country: "France",
      status: "Healthy",
    },
    {
      id: "BANK_UBS",
      name: "UBS",
      type: "Bank",
      tier: "Tier2",
      country: "Switzerland",
      status: "Healthy",
    },
    {
      id: "BANK_ING",
      name: "ING Groep",
      type: "Bank",
      tier: "Tier2",
      country: "Netherlands",
      status: "Healthy",
    },

    // ─── Hedge Funds ────────────────────────────────────────
    {
      id: "FUND_CITADEL",
      name: "Citadel LLC",
      type: "HedgeFund",
      tier: "Tier1",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "FUND_BRIDGEWATER",
      name: "Bridgewater Associates",
      type: "HedgeFund",
      tier: "Tier1",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "FUND_PERSIST",
      name: "Pershing Square",
      type: "HedgeFund",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "FUND_APOLLO",
      name: "Apollo Capital",
      type: "HedgeFund",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "FUND_ELLIOT",
      name: "Elliott Management",
      type: "HedgeFund",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "FUND_RENAISSANCE",
      name: "Renaissance Technologies",
      type: "HedgeFund",
      tier: "Tier3",
      country: "USA",
      status: "Healthy",
    },

    // ─── Brokers ────────────────────────────────────────────
    {
      id: "BROKER_VIRTU",
      name: "Virtu Financial",
      type: "Broker",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "BROKER_JANE",
      name: "Jane Street",
      type: "Broker",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "BROKER_OPTIVER",
      name: "Optiver",
      type: "Broker",
      tier: "Tier3",
      country: "Netherlands",
      status: "Healthy",
    },

    // ─── Insurers ───────────────────────────────────────────
    {
      id: "INSURER_AIG",
      name: "American International Group",
      type: "Insurer",
      tier: "Tier1",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "INSURER_BERKSHIRE",
      name: "Berkshire Hathaway Re",
      type: "Insurer",
      tier: "Tier2",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "INSURER_MUNICH",
      name: "Munich Re",
      type: "Insurer",
      tier: "Tier2",
      country: "Germany",
      status: "Healthy",
    },

    // ─── Corporates ─────────────────────────────────────────
    {
      id: "CORP_APPLE",
      name: "Apple Inc.",
      type: "Corporate",
      tier: "Tier3",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "CORP_TESLA",
      name: "Tesla Inc.",
      type: "Corporate",
      tier: "Tier3",
      country: "USA",
      status: "Healthy",
    },
    {
      id: "CORP_TESLA_FINANCE",
      name: "Tesla Finance",
      type: "Corporate",
      tier: "Tier3",
      country: "USA",
      status: "Healthy",
    },
  ];

  for (const inst of institutions) {
    await ctx.session.executeWrite(async (tx) => {
      await tx.run(
        `
        MERGE (i:Institution { id: $id })
        SET i.name = $name,
            i.type = $type,
            i.tier = $tier,
            i.country = $country,
            i.status = $status
        `,
        inst
      );
    });
    ctx.stats.institutionsCreated++;
  }

  logger.info(`✅ Created ${institutions.length} institutions.`);
}

/**
 * Seed Collateral Pools
 */
async function seedCollateralPools(ctx: SeedContext): Promise<void> {
  logger.info("💰 Seeding Collateral Pools...");

  const pools = [
    // Corporate Bonds
    {
      id: "POOL_CORP_BONDS_1",
      name: "Investment Grade Corporate Bonds Fund",
      assetClass: "CorporateBonds",
    },
    {
      id: "POOL_CORP_BONDS_2",
      name: "High Yield Corporate Bonds",
      assetClass: "CorporateBonds",
    },
    {
      id: "POOL_CORP_BONDS_3",
      name: "Emerging Market Corp Bonds",
      assetClass: "CorporateBonds",
    },

    // Sovereign
    {
      id: "POOL_SOVEREIGN_1",
      name: "US Treasury Securities",
      assetClass: "Sovereign",
    },
    {
      id: "POOL_SOVEREIGN_2",
      name: "European Sovereign Bonds",
      assetClass: "Sovereign",
    },
    {
      id: "POOL_SOVEREIGN_3",
      name: "Emerging Market Sovereigns",
      assetClass: "Sovereign",
    },

    // Equities
    {
      id: "POOL_EQUITIES_1",
      name: "US Large Cap Equities",
      assetClass: "Equities",
    },
    {
      id: "POOL_EQUITIES_2",
      name: "European Equities",
      assetClass: "Equities",
    },
    {
      id: "POOL_EQUITIES_3",
      name: "Emerging Market Equities",
      assetClass: "Equities",
    },

    // Mortgage-Backed Securities
    {
      id: "POOL_MBS_1",
      name: "US Agency MBS",
      assetClass: "MBS",
    },
    {
      id: "POOL_MBS_2",
      name: "Non-Agency MBS",
      assetClass: "MBS",
    },
    {
      id: "POOL_MBS_3",
      name: "Commercial MBS",
      assetClass: "MBS",
    },
  ];

  for (const pool of pools) {
    await ctx.session.executeWrite(async (tx) => {
      await tx.run(
        `
        MERGE (p:CollateralPool { id: $id })
        SET p.name = $name,
            p.assetClass = $assetClass
        `,
        pool
      );
    });
    ctx.stats.poolsCreated++;
  }

  logger.info(`✅ Created ${pools.length} collateral pools.`);
}

/**
 * Seed TRADES_WITH Relationships
 */
async function seedTradesWithRelationships(ctx: SeedContext): Promise<void> {
  logger.info("📊 Seeding TRADES_WITH relationships...");

  const trades = [
    // Tier1 Bank interconnections (high exposure)
    {
      from: "BANK_GS",
      to: "BANK_JPM",
      exposure: 45000000,
      product: "IRS",
    },
    {
      from: "BANK_JPM",
      to: "BANK_BNY",
      exposure: 32000000,
      product: "CDS",
    },
    {
      from: "BANK_BNY",
      to: "BANK_DB",
      exposure: 28000000,
      product: "FXSwap",
    },
    {
      from: "BANK_DB",
      to: "BANK_HSBC",
      exposure: 35000000,
      product: "IRS",
    },
    {
      from: "BANK_HSBC",
      to: "BANK_CS",
      exposure: 42000000,
      product: "RepoAgreement",
    },
    {
      from: "BANK_CS",
      to: "BANK_GS",
      exposure: 38000000,
      product: "CDS",
    },

    // Tier1 Bank -> Tier2 Bank
    {
      from: "BANK_GS",
      to: "BANK_BOA",
      exposure: 18000000,
      product: "IRS",
    },
    {
      from: "BANK_JPM",
      to: "BANK_WF",
      exposure: 22000000,
      product: "FXSwap",
    },
    {
      from: "BANK_DB",
      to: "BANK_SOCGEN",
      exposure: 19000000,
      product: "CDS",
    },
    {
      from: "BANK_HSBC",
      to: "BANK_UBS",
      exposure: 25000000,
      product: "RepoAgreement",
    },
    {
      from: "BANK_CS",
      to: "BANK_ING",
      exposure: 21000000,
      product: "IRS",
    },

    // Tier2 Bank interconnections
    {
      from: "BANK_BOA",
      to: "BANK_WF",
      exposure: 12000000,
      product: "IRS",
    },
    {
      from: "BANK_WF",
      to: "BANK_SOCGEN",
      exposure: 9000000,
      product: "CDS",
    },
    {
      from: "BANK_SOCGEN",
      to: "BANK_UBS",
      exposure: 11000000,
      product: "FXSwap",
    },
    {
      from: "BANK_UBS",
      to: "BANK_ING",
      exposure: 8000000,
      product: "RepoAgreement",
    },

    // Banks <-> Hedge Funds
    {
      from: "BANK_GS",
      to: "FUND_CITADEL",
      exposure: 50000000,
      product: "IRS",
    },
    {
      from: "BANK_JPM",
      to: "FUND_BRIDGEWATER",
      exposure: 47000000,
      product: "CDS",
    },
    {
      from: "BANK_DB",
      to: "FUND_CITADEL",
      exposure: 35000000,
      product: "FXSwap",
    },
    {
      from: "FUND_CITADEL",
      to: "BANK_BOA",
      exposure: 28000000,
      product: "IRS",
    },
    {
      from: "FUND_BRIDGEWATER",
      to: "BANK_WF",
      exposure: 24000000,
      product: "CDS",
    },

    // Hedge Funds among themselves
    {
      from: "FUND_CITADEL",
      to: "FUND_BRIDGEWATER",
      exposure: 15000000,
      product: "IRS",
    },
    {
      from: "FUND_CITADEL",
      to: "FUND_PERSIST",
      exposure: 12000000,
      product: "CDS",
    },
    {
      from: "FUND_BRIDGEWATER",
      to: "FUND_APOLLO",
      exposure: 10000000,
      product: "IRS",
    },
    {
      from: "FUND_PERSIST",
      to: "FUND_ELLIOT",
      exposure: 8000000,
      product: "FXSwap",
    },

    // Banks <-> Brokers
    {
      from: "BANK_GS",
      to: "BROKER_VIRTU",
      exposure: 22000000,
      product: "IRS",
    },
    {
      from: "BANK_JPM",
      to: "BROKER_JANE",
      exposure: 19000000,
      product: "CDS",
    },
    {
      from: "BANK_BNY",
      to: "BROKER_OPTIVER",
      exposure: 14000000,
      product: "FXSwap",
    },
    {
      from: "BROKER_VIRTU",
      to: "BANK_BOA",
      exposure: 16000000,
      product: "RepoAgreement",
    },
    {
      from: "BROKER_JANE",
      to: "BANK_WF",
      exposure: 13000000,
      product: "IRS",
    },

    // Banks <-> Insurers
    {
      from: "BANK_GS",
      to: "INSURER_AIG",
      exposure: 32000000,
      product: "CDS",
    },
    {
      from: "BANK_JPM",
      to: "INSURER_BERKSHIRE",
      exposure: 28000000,
      product: "IRS",
    },
    {
      from: "BANK_DB",
      to: "INSURER_MUNICH",
      exposure: 25000000,
      product: "FXSwap",
    },
    {
      from: "INSURER_AIG",
      to: "BANK_BNY",
      exposure: 20000000,
      product: "CDS",
    },
    {
      from: "INSURER_BERKSHIRE",
      to: "BANK_HSBC",
      exposure: 18000000,
      product: "IRS",
    },

    // Funds <-> Insurers
    {
      from: "FUND_CITADEL",
      to: "INSURER_AIG",
      exposure: 15000000,
      product: "IRS",
    },
    {
      from: "FUND_BRIDGEWATER",
      to: "INSURER_BERKSHIRE",
      exposure: 12000000,
      product: "CDS",
    },

    // Corporates
    {
      from: "CORP_APPLE",
      to: "BANK_GS",
      exposure: 5000000,
      product: "FXSwap",
    },
    {
      from: "CORP_TESLA",
      to: "BANK_JPM",
      exposure: 8000000,
      product: "IRS",
    },
    {
      from: "CORP_TESLA_FINANCE",
      to: "FUND_CITADEL",
      exposure: 6000000,
      product: "CDS",
    },
  ];

  for (const trade of trades) {
    await ctx.session.executeWrite(async (tx) => {
      await tx.run(
        `
        MATCH (from:Institution { id: $from })
        MATCH (to:Institution { id: $to })
        MERGE (from)-[r:TRADES_WITH { exposure: $exposure, product: $product }]->(to)
        `,
        trade
      );
    });
    ctx.stats.tradesCreated++;
  }

  logger.info(`✅ Created ${trades.length} TRADES_WITH relationships.`);
}

/**
 * Seed POSTS_COLLATERAL Relationships
 */
async function seedPostsCollateralRelationships(ctx: SeedContext): Promise<void> {
  logger.info("📌 Seeding POSTS_COLLATERAL relationships...");

  const collateralPostings = [
    // Tier1 Banks
    { from: "BANK_GS", to: "POOL_CORP_BONDS_1", value: 150000000 },
    { from: "BANK_GS", to: "POOL_SOVEREIGN_1", value: 200000000 },
    { from: "BANK_JPM", to: "POOL_CORP_BONDS_1", value: 180000000 },
    { from: "BANK_JPM", to: "POOL_EQUITIES_1", value: 120000000 },
    { from: "BANK_BNY", to: "POOL_MBS_1", value: 140000000 },
    { from: "BANK_BNY", to: "POOL_SOVEREIGN_1", value: 160000000 },
    { from: "BANK_DB", to: "POOL_CORP_BONDS_2", value: 130000000 },
    { from: "BANK_DB", to: "POOL_SOVEREIGN_2", value: 175000000 },
    { from: "BANK_HSBC", to: "POOL_CORP_BONDS_3", value: 120000000 },
    { from: "BANK_HSBC", to: "POOL_EQUITIES_2", value: 100000000 },
    { from: "BANK_CS", to: "POOL_CORP_BONDS_1", value: 110000000 },
    { from: "BANK_CS", to: "POOL_SOVEREIGN_2", value: 140000000 },

    // Tier2 Banks
    { from: "BANK_BOA", to: "POOL_CORP_BONDS_1", value: 85000000 },
    { from: "BANK_BOA", to: "POOL_MBS_1", value: 95000000 },
    { from: "BANK_WF", to: "POOL_CORP_BONDS_2", value: 75000000 },
    { from: "BANK_WF", to: "POOL_EQUITIES_1", value: 65000000 },
    { from: "BANK_SOCGEN", to: "POOL_SOVEREIGN_2", value: 90000000 },
    { from: "BANK_SOCGEN", to: "POOL_CORP_BONDS_2", value: 70000000 },
    { from: "BANK_UBS", to: "POOL_SOVEREIGN_3", value: 80000000 },
    { from: "BANK_UBS", to: "POOL_EQUITIES_2", value: 75000000 },
    { from: "BANK_ING", to: "POOL_MBS_1", value: 65000000 },
    { from: "BANK_ING", to: "POOL_CORP_BONDS_3", value: 60000000 },

    // Hedge Funds
    { from: "FUND_CITADEL", to: "POOL_EQUITIES_1", value: 250000000 },
    { from: "FUND_CITADEL", to: "POOL_CORP_BONDS_2", value: 180000000 },
    { from: "FUND_BRIDGEWATER", to: "POOL_SOVEREIGN_1", value: 200000000 },
    { from: "FUND_BRIDGEWATER", to: "POOL_EQUITIES_2", value: 160000000 },
    { from: "FUND_PERSIST", to: "POOL_CORP_BONDS_3", value: 110000000 },
    { from: "FUND_PERSIST", to: "POOL_EQUITIES_1", value: 90000000 },
    { from: "FUND_APOLLO", to: "POOL_SOVEREIGN_3", value: 85000000 },
    { from: "FUND_APOLLO", to: "POOL_MBS_2", value: 75000000 },
    { from: "FUND_ELLIOT", to: "POOL_CORP_BONDS_1", value: 70000000 },
    { from: "FUND_ELLIOT", to: "POOL_EQUITIES_3", value: 65000000 },

    // Brokers
    { from: "BROKER_VIRTU", to: "POOL_EQUITIES_1", value: 120000000 },
    { from: "BROKER_VIRTU", to: "POOL_CORP_BONDS_1", value: 90000000 },
    { from: "BROKER_JANE", to: "POOL_EQUITIES_2", value: 110000000 },
    { from: "BROKER_JANE", to: "POOL_SOVEREIGN_1", value: 100000000 },
    { from: "BROKER_OPTIVER", to: "POOL_EQUITIES_1", value: 80000000 },
    { from: "BROKER_OPTIVER", to: "POOL_MBS_1", value: 70000000 },

    // Insurers
    { from: "INSURER_AIG", to: "POOL_CORP_BONDS_1", value: 200000000 },
    { from: "INSURER_AIG", to: "POOL_SOVEREIGN_1", value: 180000000 },
    { from: "INSURER_BERKSHIRE", to: "POOL_SOVEREIGN_1", value: 160000000 },
    { from: "INSURER_BERKSHIRE", to: "POOL_CORP_BONDS_2", value: 130000000 },
    { from: "INSURER_MUNICH", to: "POOL_SOVEREIGN_2", value: 150000000 },
    { from: "INSURER_MUNICH", to: "POOL_CORP_BONDS_3", value: 120000000 },
  ];

  for (const posting of collateralPostings) {
    await ctx.session.executeWrite(async (tx) => {
      await tx.run(
        `
        MATCH (from:Institution { id: $from })
        MATCH (to:CollateralPool { id: $to })
        MERGE (from)-[r:POSTS_COLLATERAL { value: $value }]->(to)
        `,
        posting
      );
    });
    ctx.stats.collateralCreated++;
  }

  logger.info(`✅ Created ${collateralPostings.length} POSTS_COLLATERAL relationships.`);
}

/**
 * Seed OWNED_BY Relationships
 */
async function seedOwnedByRelationships(ctx: SeedContext): Promise<void> {
  logger.info("🔗 Seeding OWNED_BY relationships...");

  const ownership = [
    { from: "INSURER_BERKSHIRE", to: "INSURER_AIG", percentage: 12.5 },
    { from: "FUND_APOLLO", to: "BROKER_VIRTU", percentage: 8.3 },
    { from: "FUND_ELLIOT", to: "BANK_WF", percentage: 2.1 },
    { from: "FUND_CITADEL", to: "FUND_BRIDGEWATER", percentage: 5.5 },
    { from: "FUND_BRIDGEWATER", to: "FUND_PERSIST", percentage: 4.2 },
    { from: "CORP_APPLE", to: "FUND_CITADEL", percentage: 1.8 },
    { from: "CORP_TESLA", to: "BANK_GS", percentage: 0.5 },
    { from: "BANK_CS", to: "FUND_CITADEL", percentage: 3.2 },
    { from: "BANK_DB", to: "FUND_BRIDGEWATER", percentage: 2.9 },
  ];

  for (const own of ownership) {
    await ctx.session.executeWrite(async (tx) => {
      await tx.run(
        `
        MATCH (from:Institution { id: $from })
        MATCH (to:Institution { id: $to })
        MERGE (from)-[r:OWNED_BY { percentage: $percentage }]->(to)
        `,
        own
      );
    });
    ctx.stats.ownershipCreated++;
  }

  logger.info(`✅ Created ${ownership.length} OWNED_BY relationships.`);
}

/**
 * Print Summary Statistics
 */
function printStatistics(ctx: SeedContext): void {
  const elapsed = Date.now() - ctx.stats.startTime;
  const totalNodes = ctx.stats.institutionsCreated + ctx.stats.poolsCreated;
  const totalEdges =
    ctx.stats.tradesCreated +
    ctx.stats.collateralCreated +
    ctx.stats.ownershipCreated;

  console.log("\n" + "=".repeat(60));
  console.log("📊 SEED DATA STATISTICS");
  console.log("=".repeat(60));
  console.log(`⏱️  Total Time: ${elapsed}ms`);
  console.log(`\n📈 Nodes Created:`);
  console.log(`   • Institutions: ${ctx.stats.institutionsCreated}`);
  console.log(`   • Collateral Pools: ${ctx.stats.poolsCreated}`);
  console.log(`   • Total Nodes: ${totalNodes}`);
  console.log(`\n🔗 Relationships Created:`);
  console.log(`   • TRADES_WITH: ${ctx.stats.tradesCreated}`);
  console.log(`   • POSTS_COLLATERAL: ${ctx.stats.collateralCreated}`);
  console.log(`   • OWNED_BY: ${ctx.stats.ownershipCreated}`);
  console.log(`   • Total Edges: ${totalEdges}`);
  console.log("=".repeat(60) + "\n");
}

/**
 * Main execution pipeline
 */
async function main(): Promise<void> {
  const driver = getDriver();
  const session = driver.session();

  const ctx: SeedContext = {
    driver,
    session,
    stats: {
      institutionsCreated: 0,
      poolsCreated: 0,
      tradesCreated: 0,
      collateralCreated: 0,
      ownershipCreated: 0,
      startTime: Date.now(),
    },
  };

  try {
    logger.info("🔗 Verifying CognoDB connectivity for seeding...");
    await pingDatabaseOnStartup();

    await clearDatabase(ctx);
    await seedInstitutions(ctx);
    await seedCollateralPools(ctx);
    await seedTradesWithRelationships(ctx);
    await seedPostsCollateralRelationships(ctx);
    await seedOwnedByRelationships(ctx);

    printStatistics(ctx);
    logger.info("🎉 Database seeding completed successfully!");
  } catch (error) {
    logger.error("❌ Seeding failed:", { error: (error as Error).message });
    process.exit(1);
  } finally {
    if (session) {
      await session.close();
    }
    await closeDriver();
  }
}

// Execute
main();
