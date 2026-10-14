'use server';

import { getServices } from '@/lib/data';

export async function fetchMoreServicesAction(page: number, limit: number = 20) {
  return await getServices(page, limit);
}
