import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      company: user.company,
      city: user.city,
      state: user.state,
      verified: user.verified,
      avatarUrl: user.avatarUrl,
      credits: user.credits ? parseFloat(user.credits.toString()) : 0,
    },
  });
}
