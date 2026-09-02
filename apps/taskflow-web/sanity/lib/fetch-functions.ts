import { client } from './client';
import { ALL_COURSES_QUERY } from './queries';

export async function getCourses() {
  return await client.fetch(ALL_COURSES_QUERY);
}
