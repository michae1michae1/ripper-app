import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const hostPassword = process.env.HOST_PASS;

    if (!hostPassword) {
      console.error('HOST_PASS environment variable not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const isValid = password === hostPassword;

    return res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Error verifying password:', error);
    return res.status(500).json({ message: 'Failed to verify password' });
  }
}

