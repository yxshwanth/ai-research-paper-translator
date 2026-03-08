import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function getOrCreateUser(req?: NextRequest) {
  const session = req
    ? await auth0.getSession(req)
    : await auth0.getSession();

  if (!session?.user) return null;

  const auth0Id = session.user.sub as string;
  const email = (session.user.email as string) ?? null;
  const name = (session.user.name as string) ?? null;

  if (!prisma) return { auth0Id, email, name, id: null };

  const user = await prisma.user.upsert({
    where: { auth0Id },
    create: { auth0Id, email, name },
    update: { email, name },
  });

  return user;
}
