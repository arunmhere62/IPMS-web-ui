export const AWS_CONFIG = {
  S3: {
    accessKeyId: (import.meta as any).env?.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: (import.meta as any).env?.VITE_AWS_SECRET_ACCESS_KEY || '',
    region: (import.meta as any).env?.VITE_AWS_REGION || 'ap-south-1',
    bucketName: (import.meta as any).env?.VITE_AWS_S3_BUCKET_NAME || 'indianpgmanagement',
  },
}

export const getAWSConfig = () => AWS_CONFIG

export const getS3Config = () => getAWSConfig().S3

export default AWS_CONFIG
