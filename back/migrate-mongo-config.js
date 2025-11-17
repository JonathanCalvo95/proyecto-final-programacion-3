import dotenv from 'dotenv'
const env_path = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env'

dotenv.config({ path: env_path })

const db_url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/'
const db_name = process.env.MONGO_DB || 'test'

const config = {
  mongodb: {
    url: db_url,
    databaseName: db_name,
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  lockCollectionName: 'changelog_lock',
  lockTtl: 0,
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
}

export default config