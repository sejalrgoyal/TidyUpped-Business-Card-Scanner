import VCard from 'vcf';

export function generateVCard(contact: {
  name: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  website?: string;
  address?: string;
}) {
  const card = new VCard();
  card.set('n', contact.name);
  card.set('fn', contact.name);
  if (contact.email) card.set('email', contact.email);
  if (contact.phone) card.set('tel', contact.phone);
  if (contact.jobTitle) card.set('title', contact.jobTitle);
  if (contact.company) card.set('org', contact.company);
  if (contact.website) card.set('url', contact.website);
  if (contact.address) card.set('adr', contact.address);
  return card.toString();
}

export function downloadVCard(contact: any) {
  const vcfData = generateVCard(contact);
  const blob = new Blob([vcfData], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
