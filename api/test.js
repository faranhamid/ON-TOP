export default function handler(req, res) {
    res.status(200).json({
        status: 'working',
        timestamp: new Date().toISOString(),
        message: 'Vercel serverless function is working'
    });
}
