import neo4j, { Driver } from 'neo4j-driver'

let driver: Driver | null = null

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI
    const username = process.env.NEO4J_USERNAME
    const password = process.env.NEO4J_PASSWORD

    if (!uri || !username || !password) {
      throw new Error('Neo4j environment variables are not properly configured')
    }

    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      }
    )
  }

  return driver
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close()
    driver = null
  }
}

// Helper function to run queries
export async function runQuery(cypher: string, params = {}) {
  const session = getDriver().session()
  try {
    const result = await session.run(cypher, params)
    return result.records
  } finally {
    await session.close()
  }
}

// Initialize driver when the app starts
export async function initializeDriver(): Promise<void> {
  try {
    const driver = getDriver()
    await driver.verifyConnectivity()
    console.log('Neo4j connection established successfully')
  } catch (error) {
    console.error('Failed to establish Neo4j connection:', error)
    throw error
  }
}