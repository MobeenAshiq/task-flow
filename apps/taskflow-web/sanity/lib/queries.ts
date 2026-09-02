import { groq } from 'next-sanity';

export const ALL_COURSES_QUERY = groq`*[_type == "course"]`;
