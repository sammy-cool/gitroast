// Lucide-style line icons, 1.75px stroke. Flames mark brand moments, not every action.
const PATHS = {
  flame: "M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-1.7.8-3 1.7-4 .2 1.2.9 2 1.8 2.2C10.2 8.2 10.5 5.6 12 3z",
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  users: "M16 20v-1.5a4 4 0 00-4-4H7a4 4 0 00-4 4V20M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1.5a4 4 0 00-3-3.9M15.5 4.2a3.5 3.5 0 010 6.6",
  bookmark: "M6 3h12v18l-6-4-6 4V3z",
  list: "M9 6h12M9 12h12M9 18h12M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  columns: "M4 4h16v16H4zM12 4v16",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  share: "M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  check: "M5 12.5l4.5 4.5L19 7.5",
  doc: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6",
  shield: "M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3zM9 12l2 2 4-4",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
};

export default function Icon({ name, size = 18, className, ...rest }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={PATHS[name] || PATHS.flame} />
    </svg>
  );
}
