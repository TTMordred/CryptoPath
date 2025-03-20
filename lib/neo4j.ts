
import neo4j, { Driver, Session } from 'neo4j-driver'

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

// Helper function to run queries with error handling and more detailed logging
export async function runQuery(cypher: string, params = {}) {
  let session: Session | null = null;
  
  try {
    session = getDriver().session();
    console.log(`Executing Neo4j query: ${cypher.substring(0, 100)}...`);
    console.log(`With parameters: ${JSON.stringify(params)}`);
    
    const startTime = Date.now();
    const result = await session.run(cypher, params);
    const endTime = Date.now();
    
    console.log(`Query executed in ${endTime - startTime}ms, returned ${result.records.length} records`);
    
    return result.records;
  } catch (error) {
    console.error('Neo4j query execution failed:', error);
    
    // Check for specific Neo4j error types
    if (error instanceof Error) {
      if (error.message.includes('Neo.ClientError.Schema')) {
        throw new Error(`Database schema error: ${error.message}`);
      } else if (error.message.includes('Neo.ClientError.Procedure')) {
        throw new Error(`Procedure call error: ${error.message}`);
      } else if (error.message.includes('Neo.ClientError.Security')) {
        throw new Error('Database authentication or authorization error');
      } else if (error.message.includes('Neo.ClientError.Transaction')) {
        throw new Error(`Transaction error: ${error.message}`);
      }
    }
    
    // Re-throw the original error if it wasn't handled specifically
    throw error;
  } finally {
    if (session) {
      await session.close();
    }
  }
}

// Initialize driver when the app starts
export async function initializeDriver(): Promise<void> {
  try {
    const driver = getDriver();
    await driver.verifyConnectivity();
    console.log('Neo4j connection established successfully');
  } catch (error) {
    console.error('Failed to establish Neo4j connection:', error);
    throw error;
  }
}
