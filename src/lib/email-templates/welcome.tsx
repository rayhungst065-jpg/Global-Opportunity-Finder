import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_URL = 'https://globalopportunityfinder.org'

const WelcomeEmail = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Global Opportunity Finder — we're glad you're here.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Global Opportunity Finder!</Heading>
        <Text style={text}>Hi there,</Text>
        <Text style={text}>Welcome to Global Opportunity Finder!</Text>
        <Text style={text}>We're excited to have you join our community!</Text>
        <Text style={text}>
          Global Opportunity Finder was created to help students discover opportunities that match their interests, explore new possibilities, and take meaningful steps toward their future goals. Whether you're looking for competitions, research programs, internships, scholarships, or volunteer opportunities, we're here to help you find your next opportunity.
        </Text>
        <Text style={text}>
          We hope this platform helps you explore your interests, connect with students who share similar goals, and discover opportunities you might not have found otherwise.
        </Text>
        <Text style={text}>
          We're always working to make Global Opportunity Finder better for students. As the platform grows, we'll occasionally send you emails about important new features and updates that can help you make the most of your experience.
        </Text>
        <Text style={text}>Thank you for joining us and being part of this journey. We're glad you're here!</Text>
        <Button style={button} href={SITE_URL}>Visit Global Opportunity Finder</Button>
        <Text style={signoff}>Best regards,<br />Ray<br />Creator of Global Opportunity Finder</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Global Opportunity Finder!',
  displayName: 'Welcome email',
  previewData: {},
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Manrope, Arial, sans-serif' }
const container = { padding: '28px 25px', maxWidth: '560px' }
const h1 = { fontFamily: 'Sora, Arial, sans-serif', fontSize: '24px', fontWeight: 700, color: '#14213d', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const button = { backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '10px', padding: '12px 20px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block', margin: '8px 0 20px' }
const signoff = { ...text, margin: '8px 0 0' }
