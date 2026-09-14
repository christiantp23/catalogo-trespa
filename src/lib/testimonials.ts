import { sbRest } from './supabase';

export interface DbTestimonial {
  id: string;
  client_name: string;
  phone_color: string;
  chat_screenshot: string | null;
  video_url: string | null;
  is_video: boolean;
  sort_order: number;
}

export async function fetchTestimonials(): Promise<DbTestimonial[]> {
  return sbRest<DbTestimonial[]>('testimonials?select=*&order=sort_order.asc');
}

export async function fetchAdminTestimonials(): Promise<DbTestimonial[]> {
  return sbRest<DbTestimonial[]>('testimonials?select=*&order=sort_order.asc', { useAuth: true });
}

export type TestimonialInput = Omit<DbTestimonial, 'id'>;

export async function createTestimonial(input: TestimonialInput): Promise<DbTestimonial> {
  const rows = await sbRest<DbTestimonial[]>('testimonials', {
    method: 'POST',
    useAuth: true,
    body: input,
  });
  return rows[0];
}

export async function updateTestimonial(id: string, input: Partial<TestimonialInput>): Promise<void> {
  await sbRest(`testimonials?id=eq.${id}`, { method: 'PATCH', useAuth: true, body: input });
}

export async function deleteTestimonial(id: string): Promise<void> {
  await sbRest(`testimonials?id=eq.${id}`, { method: 'DELETE', useAuth: true });
}
