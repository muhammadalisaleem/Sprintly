// Fake data for weeks 1–2. Field names match the mongoose models,
// so in week 3 only the place the data comes from changes.

export const users = [
  {
    _id: 'u1',
    name: 'Sara Khan',
    email: 'sara@sprintly.dev',
    role: 'freelancer',
    bio: 'Full-stack developer who builds fast, clean web apps.',
    skills: ['React', 'Node.js', 'MongoDB'],
    hourlyRate: 40,
    ratingAvg: 4.8,
  },
  {
    _id: 'u2',
    name: 'Bilal Ahmed',
    email: 'bilal@sprintly.dev',
    role: 'freelancer',
    bio: 'Brand and UI designer.',
    skills: ['Figma', 'Branding', 'Illustration'],
    hourlyRate: 35,
    ratingAvg: 5,
  },
  {
    _id: 'u3',
    name: 'Hamza Malik',
    email: 'hamza@acme.com',
    role: 'client',
    bio: 'Owner of Acme Store.',
    skills: [],
    hourlyRate: 0,
    ratingAvg: 0,
  },
  {
    _id: 'u4',
    name: 'Ayesha Raza',
    email: 'ayesha@fitapp.io',
    role: 'client',
    bio: 'Product manager at FitApp.',
    skills: [],
    hourlyRate: 0,
    ratingAvg: 0,
  },
  {
    _id: 'u5',
    name: 'Usman Tariq',
    email: 'usman@spiceroute.pk',
    role: 'client',
    bio: 'Runs the Spice Route restaurant.',
    skills: [],
    hourlyRate: 0,
    ratingAvg: 4,
  },
]

export const projects = [
  {
    _id: 'p1',
    title: 'E-commerce website',
    description: 'Online store for Acme with product pages, cart and checkout.',
    freelancer: 'u1',
    client: 'u3',
    budget: 3000,
    deadline: '2026-11-30',
    status: 'active',
    createdAt: '2026-07-20T10:00:00Z',
  },
  {
    _id: 'p2',
    title: 'Mobile app landing page',
    description: 'Marketing landing page for the FitApp launch.',
    freelancer: 'u1',
    client: 'u4',
    budget: 1200,
    deadline: '2026-11-10',
    status: 'active',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    _id: 'p3',
    title: 'Brand identity design',
    description: 'Logo, colours and brand guide for Spice Route.',
    freelancer: 'u2',
    client: 'u5',
    budget: 900,
    deadline: '2026-09-30',
    status: 'completed',
    createdAt: '2026-08-25T10:00:00Z',
  },
  {
    _id: 'p4',
    title: 'Restaurant booking system',
    description: 'Table booking website with an admin panel.',
    freelancer: 'u1',
    client: 'u5',
    budget: 2500,
    deadline: '2027-01-15',
    status: 'proposal',
    createdAt: '2026-10-20T10:00:00Z',
  },
]

export const proposals = [
  {
    _id: 'pr1',
    project: 'p1',
    scope: 'Design and build a full online store.',
    deliverables: ['Design mockups', 'Frontend pages', 'Payment integration'],
    amount: 3000,
    timeline: '4 months',
    status: 'accepted',
    createdAt: '2026-07-21T10:00:00Z',
  },
  {
    _id: 'pr2',
    project: 'p2',
    scope: 'One-page responsive landing page.',
    deliverables: ['Landing page design', 'Final build'],
    amount: 1200,
    timeline: '10 weeks',
    status: 'accepted',
    createdAt: '2026-08-16T10:00:00Z',
  },
  {
    _id: 'pr3',
    project: 'p3',
    scope: 'Complete brand identity.',
    deliverables: ['Logo concepts', 'Brand guide'],
    amount: 900,
    timeline: '5 weeks',
    status: 'accepted',
    createdAt: '2026-08-26T10:00:00Z',
  },
  {
    _id: 'pr4',
    project: 'p4',
    scope: 'Booking website with table management for staff.',
    deliverables: ['Booking flow', 'Admin panel', 'Email confirmations'],
    amount: 2500,
    timeline: '3 months',
    status: 'pending',
    createdAt: '2026-10-21T10:00:00Z',
  },
]

export const milestones = [
  { _id: 'm1', project: 'p1', title: 'Design mockups', dueDate: '2026-10-10', amount: 600, completed: true },
  { _id: 'm2', project: 'p1', title: 'Frontend pages', dueDate: '2026-10-31', amount: 1200, completed: false },
  { _id: 'm3', project: 'p1', title: 'Payment integration', dueDate: '2026-11-25', amount: 1200, completed: false },
  { _id: 'm4', project: 'p2', title: 'Landing page design', dueDate: '2026-10-20', amount: 400, completed: true },
  { _id: 'm5', project: 'p2', title: 'Final build', dueDate: '2026-11-10', amount: 800, completed: false },
  { _id: 'm6', project: 'p3', title: 'Logo concepts', dueDate: '2026-09-05', amount: 400, completed: true },
  { _id: 'm7', project: 'p3', title: 'Brand guide', dueDate: '2026-09-28', amount: 500, completed: true },
]

export const tasks = [
  { _id: 't1', project: 'p1', milestone: 'm1', title: 'Homepage mockup', description: '', status: 'done', priority: 'high', dueDate: '2026-10-05' },
  { _id: 't2', project: 'p1', milestone: 'm2', title: 'Product page', description: 'Gallery, price, add to cart.', status: 'doing', priority: 'high', dueDate: '2026-10-28' },
  { _id: 't3', project: 'p1', milestone: 'm2', title: 'Cart page', description: '', status: 'todo', priority: 'medium', dueDate: '2026-10-31' },
  { _id: 't4', project: 'p1', milestone: 'm3', title: 'Stripe checkout', description: '', status: 'todo', priority: 'medium', dueDate: '2026-11-20' },
  { _id: 't5', project: 'p2', milestone: 'm4', title: 'Hero section design', description: '', status: 'done', priority: 'high', dueDate: '2026-10-15' },
  { _id: 't6', project: 'p2', milestone: 'm5', title: 'Build responsive layout', description: '', status: 'doing', priority: 'high', dueDate: '2026-11-01' },
  { _id: 't7', project: 'p2', milestone: 'm5', title: 'Contact form', description: '', status: 'todo', priority: 'low', dueDate: '2026-11-08' },
  { _id: 't8', project: 'p3', milestone: 'm6', title: 'Three logo options', description: '', status: 'done', priority: 'high', dueDate: '2026-09-04' },
  { _id: 't9', project: 'p3', milestone: 'm7', title: 'Colour palette', description: '', status: 'done', priority: 'medium', dueDate: '2026-09-20' },
  { _id: 't10', project: 'p3', milestone: 'm7', title: 'Brand guide PDF', description: '', status: 'done', priority: 'medium', dueDate: '2026-09-27' },
]

export const timeEntries = [
  { _id: 'te1', user: 'u1', project: 'p1', task: 't1', hours: 6, date: '2026-10-01', note: 'Homepage wireframes', invoiced: true },
  { _id: 'te2', user: 'u1', project: 'p1', task: 't1', hours: 4.5, date: '2026-10-03', note: 'Homepage visual design', invoiced: true },
  { _id: 'te3', user: 'u1', project: 'p2', task: 't5', hours: 5, date: '2026-10-06', note: 'Hero section', invoiced: true },
  { _id: 'te4', user: 'u1', project: 'p1', task: 't2', hours: 4.5, date: '2026-10-08', note: 'Product page layout', invoiced: true },
  { _id: 'te5', user: 'u1', project: 'p2', task: 't5', hours: 5, date: '2026-10-13', note: 'Hero animations', invoiced: true },
  { _id: 'te6', user: 'u1', project: 'p1', task: 't2', hours: 3, date: '2026-10-15', note: 'Image gallery', invoiced: false },
  { _id: 'te7', user: 'u1', project: 'p2', task: 't6', hours: 2.5, date: '2026-10-19', note: 'Grid layout', invoiced: false },
  { _id: 'te8', user: 'u1', project: 'p1', task: 't2', hours: 3.5, date: '2026-10-20', note: 'Add to cart button', invoiced: false },
  { _id: 'te9', user: 'u1', project: 'p2', task: 't6', hours: 4, date: '2026-10-22', note: 'Mobile breakpoints', invoiced: false },
  { _id: 'te10', user: 'u1', project: 'p1', task: 't3', hours: 2, date: '2026-10-23', note: 'Cart page start', invoiced: false },
  { _id: 'te11', user: 'u2', project: 'p3', task: 't8', hours: 8, date: '2026-09-02', note: 'Logo sketches', invoiced: true },
  { _id: 'te12', user: 'u2', project: 'p3', task: 't10', hours: 6, date: '2026-09-25', note: 'Brand guide layout', invoiced: true },
]

export const invoices = [
  {
    _id: 'inv1',
    number: 'INV-001',
    project: 'p1',
    freelancer: 'u1',
    client: 'u3',
    items: [{ description: 'Project deposit', qty: 1, rate: 500, amount: 500 }],
    total: 500,
    status: 'paid',
    dueDate: '2026-08-05',
    paidAt: '2026-08-03T12:00:00Z',
    createdAt: '2026-07-25T10:00:00Z',
  },
  {
    _id: 'inv2',
    number: 'INV-002',
    project: 'p2',
    freelancer: 'u1',
    client: 'u4',
    items: [{ description: 'Project deposit', qty: 1, rate: 300, amount: 300 }],
    total: 300,
    status: 'paid',
    dueDate: '2026-09-01',
    paidAt: '2026-09-02T12:00:00Z',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    _id: 'inv3',
    number: 'INV-003',
    project: 'p1',
    freelancer: 'u1',
    client: 'u3',
    items: [{ description: 'Milestone: Design mockups', qty: 1, rate: 600, amount: 600 }],
    total: 600,
    status: 'paid',
    dueDate: '2026-10-20',
    paidAt: '2026-10-14T12:00:00Z',
    createdAt: '2026-10-10T10:00:00Z',
  },
  {
    _id: 'inv4',
    number: 'INV-004',
    project: 'p1',
    freelancer: 'u1',
    client: 'u3',
    items: [
      { description: 'Homepage wireframes (6 h)', qty: 6, rate: 40, amount: 240 },
      { description: 'Homepage visual design (4.5 h)', qty: 4.5, rate: 40, amount: 180 },
      { description: 'Product page layout (4.5 h)', qty: 4.5, rate: 40, amount: 180 },
    ],
    total: 600,
    status: 'overdue',
    dueDate: '2026-10-20',
    paidAt: null,
    createdAt: '2026-10-09T10:00:00Z',
  },
  {
    _id: 'inv5',
    number: 'INV-005',
    project: 'p2',
    freelancer: 'u1',
    client: 'u4',
    items: [{ description: 'Hero section (10 h)', qty: 10, rate: 40, amount: 400 }],
    total: 400,
    status: 'unpaid',
    dueDate: '2026-11-05',
    paidAt: null,
    createdAt: '2026-10-21T10:00:00Z',
  },
  {
    _id: 'inv6',
    number: 'INV-006',
    project: 'p3',
    freelancer: 'u2',
    client: 'u5',
    items: [{ description: 'Milestone: Logo concepts', qty: 1, rate: 400, amount: 400 }],
    total: 400,
    status: 'paid',
    dueDate: '2026-09-15',
    paidAt: '2026-09-08T12:00:00Z',
    createdAt: '2026-09-05T10:00:00Z',
  },
  {
    _id: 'inv7',
    number: 'INV-007',
    project: 'p3',
    freelancer: 'u2',
    client: 'u5',
    items: [{ description: 'Milestone: Brand guide', qty: 1, rate: 500, amount: 500 }],
    total: 500,
    status: 'paid',
    dueDate: '2026-10-10',
    paidAt: '2026-10-02T12:00:00Z',
    createdAt: '2026-09-28T10:00:00Z',
  },
]

export const messages = [
  { _id: 'msg1', project: 'p1', sender: 'u3', text: 'Hi Sara, excited to get started!', fileUrl: '', fileName: '', createdAt: '2026-07-22T09:00:00Z' },
  { _id: 'msg2', project: 'p1', sender: 'u1', text: 'Thanks Hamza! I will share the first mockups next week.', fileUrl: '', fileName: '', createdAt: '2026-07-22T09:15:00Z' },
  { _id: 'msg3', project: 'p1', sender: 'u1', text: 'Here are the homepage mockups.', fileUrl: '#', fileName: 'homepage-mockup.png', createdAt: '2026-10-05T14:00:00Z' },
  { _id: 'msg4', project: 'p1', sender: 'u3', text: 'Looks great, approved 👍', fileUrl: '', fileName: '', createdAt: '2026-10-05T16:30:00Z' },
  { _id: 'msg5', project: 'p1', sender: 'u3', text: 'How is the product page coming along?', fileUrl: '', fileName: '', createdAt: '2026-10-23T11:00:00Z' },
  { _id: 'msg6', project: 'p2', sender: 'u4', text: 'Can we use our new brand colours on the hero?', fileUrl: '', fileName: '', createdAt: '2026-10-12T10:00:00Z' },
  { _id: 'msg7', project: 'p2', sender: 'u1', text: 'Sure, please send me the palette.', fileUrl: '', fileName: '', createdAt: '2026-10-12T10:20:00Z' },
  { _id: 'msg8', project: 'p2', sender: 'u4', text: 'Attached.', fileUrl: '#', fileName: 'fitapp-colours.pdf', createdAt: '2026-10-12T11:00:00Z' },
  { _id: 'msg9', project: 'p3', sender: 'u5', text: 'Thanks Bilal, the brand guide is perfect.', fileUrl: '', fileName: '', createdAt: '2026-09-29T10:00:00Z' },
]

export const notifications = [
  { _id: 'n1', user: 'u1', text: 'Hamza Malik sent a new message on E-commerce website', link: '/chat?project=p1', read: false, createdAt: '2026-10-23T11:00:00Z' },
  { _id: 'n2', user: 'u1', text: 'Invoice INV-004 is overdue', link: '/invoices/inv4', read: false, createdAt: '2026-10-21T08:00:00Z' },
  { _id: 'n3', user: 'u1', text: 'Milestone "Landing page design" was marked complete', link: '/projects/p2/milestones', read: false, createdAt: '2026-10-20T15:00:00Z' },
  { _id: 'n4', user: 'u1', text: 'Hamza Malik paid invoice INV-003', link: '/invoices/inv3', read: true, createdAt: '2026-10-14T12:00:00Z' },
  { _id: 'n5', user: 'u3', text: 'Sara Khan sent you invoice INV-004', link: '/invoices/inv4', read: false, createdAt: '2026-10-09T10:00:00Z' },
  { _id: 'n6', user: 'u4', text: 'Sara Khan sent you invoice INV-005', link: '/invoices/inv5', read: false, createdAt: '2026-10-21T10:00:00Z' },
  { _id: 'n7', user: 'u5', text: 'Sara Khan sent you a proposal for Restaurant booking system', link: '/proposals/pr4', read: false, createdAt: '2026-10-21T10:00:00Z' },
]

export const reviews = [
  { _id: 'r1', project: 'p3', from: 'u5', to: 'u2', rating: 5, comment: 'Creative, fast and easy to work with.', createdAt: '2026-10-01T10:00:00Z' },
  { _id: 'r2', project: 'p3', from: 'u2', to: 'u5', rating: 4, comment: 'Clear feedback and paid on time.', createdAt: '2026-10-01T12:00:00Z' },
]

// ---------- helpers ----------

export function getUser(id) {
  return users.find((u) => u._id === id)
}

export function getProject(id) {
  return projects.find((p) => p._id === id)
}

// projects where the user is the freelancer or the client
export function getUserProjects(userId) {
  return projects.filter((p) => p.freelancer === userId || p.client === userId)
}

// Logged-in user until AuthContext is ready.
// Set localStorage.mockUserId (e.g. 'u3') to try the app as a client.
export function getCurrentUser() {
  let id = 'u1'
  try {
    id = localStorage.getItem('mockUserId') || id
  } catch {
    // storage blocked, keep the default user
  }
  return getUser(id) || users[0]
}

// new id for items created in the browser
export function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
