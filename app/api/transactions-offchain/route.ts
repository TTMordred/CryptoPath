import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    // Cypher query: find relationships of type "Transfer" 
    // where the given address is either the sender or receiver.
    const cypher = `
      MATCH (f:\`From Wallet Address\`)-[t:Transfer]->(to:\`To Wallet Address\`)
      WHERE f.addressId = $address OR to.addressId = $address
      RETURN f, t, to
    `;

    const records = await runQuery(cypher, { address });

    // Transform each record into a transaction object.
    // Adjust property names if they differ in your database.
    const transactions = records.map((record) => {
      const fromNode = record.get("f");
      const transferRel = record.get("t");
      const toNode = record.get("to");

      // Extract relevant properties from the relationship (transaction).
      const {
        hash = "N/A",             // Unique transaction hash
        value = "0",              // Transaction value (wei)
        block_timestamp = "0",    // Timestamp in seconds
      } = transferRel.properties || {};

      // Convert the relationship's value from Wei to ETH if present.
      const ethValue = `${(Number.parseFloat(value) / 1e18).toFixed(4)} ETH`;

      return {
        id: hash,  // or use transferRel.elementId if you prefer
        from: fromNode.properties.addressId,
        to: toNode.properties.addressId,
        value: ethValue,
        // Convert block_timestamp (seconds) to an ISO date string.
        timestamp: new Date(Number.parseInt(block_timestamp) * 1000).toISOString(),
      };
    });

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions from Neo4j:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}