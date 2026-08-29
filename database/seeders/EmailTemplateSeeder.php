<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\EmailTemplateLang;
use App\Models\UserEmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        $langCodes = collect($languages)->pluck('code')->toArray();

        $templates = [
            // User Created
            [
                'name' => 'User Created',
                'from' => 'Support Team',
                'translations' => [
                    'en' => [
                        'subject' => 'Welcome to our platform - {user_name}',
                        'content' => '<p>Hello {user_name},</p><p>Your account has been successfully created.</p><p><strong>Login Details:</strong></p><ul><li>Website: {app_url}</li><li>Email: {user_email}</li><li>Password: {user_password}</li><li>Account Type: {user_type}</li></ul><p>Please keep this information secure.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
            // Lead Assigned
            [
                'name' => 'Lead Assigned',
                'from' => 'Sales Team',
                'translations' => [
                    'en' => [
                        'subject' => 'New Lead Assigned to You - {lead_name}',
                        'content' => '<p>Hello {assigned_user_name},</p><p>A new lead has been assigned to you. Please review the details below and follow up accordingly.</p><p><strong>Lead Details:</strong></p><ul><li>Name: {lead_name}</li><li>Email: {lead_email}</li><li>Phone: {lead_phone}</li><li>Company: {lead_company}</li></ul><p>Please contact this lead as soon as possible to maximize conversion opportunities.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
            // Lead Moved
            [
                'name' => 'Lead Moved',
                'from' => 'Sales Team',
                'translations' => [
                    'en' => [
                        'subject' => 'Lead Moved - {lead_name}',
                        'content' => '<p>Hello {assigned_user_name},</p><p>The lead <strong>{lead_name}</strong> has been moved from <strong>{old_lead_stage}</strong> to <strong>{new_lead_stage}</strong>. Please review the details below and follow up accordingly.</p><p><strong>Lead Details:</strong></p><ul><li>Name: {lead_name}</li><li>Email: {lead_email}</li><li>Phone: {lead_phone}</li><li>Company: {lead_company}</li></ul><p>Thank you for your continued hard work and dedication.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
            // Quote Created
            [
                'name' => 'Quote Created',
                'from' => 'Sales Team',
                'translations' => [
                    'en' => [
                        'subject' => 'New Quote Created - {quote_name}',
                        'content' => '<p>Hello {billing_contact_name},</p><p>A new quote has been created for you. Please review the details below.</p><p><strong>Quote Details:</strong></p><ul><li>Quote Number: {quote_number}</li><li>Quote Name: {quote_name}</li><li>Account: {account_name}</li><li>Total Amount: {quote_total}</li><li>Valid Until: {quote_valid_until}</li><li>Status: {quote_status}</li></ul><p><strong>Assigned Sales Representative:</strong></p><p>{assigned_user_name} - {assigned_user_email}</p><p>Please contact your sales representative if you have any questions about this quote.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ],
                ]
            ],
            // Quote Status Changed
            [
                'name' => 'Quote Status Changed',
                'from' => 'Sales Team',
                'translations' => [
                    'en' => [
                        'subject' => 'Quote Status Updated - {quote_name}',
                        'content' => '<p>Hello {billing_contact_name},</p><p>The status of your quote has been updated from <strong>{old_quote_status}</strong> to <strong>{new_quote_status}</strong>.</p><p><strong>Quote Details:</strong></p><ul><li>Quote Number: {quote_number}</li><li>Quote Name: {quote_name}</li><li>Account: {account_name}</li><li>Total Amount: {quote_total}</li><li>Valid Until: {quote_valid_until}</li><li>Current Status: {new_quote_status}</li></ul><p><strong>Assigned Sales Representative:</strong></p><p>{assigned_user_name} - {assigned_user_email}</p><p>Please contact your sales representative if you have any questions about this status change.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ],
            ],
            // Task Assigned
            [
                'name' => 'Task Assigned',
                'from' => 'Project Team',
                'translations' => [
                    'en' => [
                        'subject' => 'New Task Assigned to You - {task_title}',
                        'content' => '<p>Hello {assigned_user_name},</p><p>A new task has been assigned to you. Please review the details below and take appropriate action.</p><p><strong>Task Details:</strong></p><ul><li>Task Title: {task_title}</li><li>Project: {project_name}</li><li>Priority: {task_priority}</li><li>Due Date: {task_due_date}</li><li>Status: {task_status}</li><li>Estimated Hours: {task_estimated_hours}</li></ul><p><strong>Description:</strong></p><p>{task_description}</p><p><strong>Assigned By:</strong></p><p>{creator_name} - {creator_email}</p><p>Please log into the system to view full task details and update progress as needed.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
            // Meeting Invitation
            [
                'name' => 'Meeting Invitation',
                'from' => 'Meeting Organizer',
                'translations' => [
                    'en' => [
                        'subject' => 'Meeting Invitation: {meeting_title}',
                        'content' => '<p>Hello {attendee_name},</p><p>You are invited to attend the following meeting:</p><p><strong>Meeting Details:</strong></p><ul><li>Title: {meeting_title}</li><li>Date: {meeting_date}</li><li>Time: {meeting_start_time} - {meeting_end_time}</li><li>Location: {meeting_location}</li></ul><p><strong>Description:</strong></p><p>{meeting_description}</p><p>Please confirm your attendance and add this meeting to your calendar.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
            // Case Created
            [
                'name' => 'Case Created',
                'from' => 'Support Team',
                'translations' => [
                    'en' => [
                        'subject' => 'New Support Case Assigned - {case_subject}',
                        'content' => '<p>Hello {assigned_user_name},</p><p>A new support case has been assigned to you. Please review the details below and take the necessary actions.</p><p><strong>Case Details:</strong></p><ul><li>Subject: {case_subject}</li><li>Priority: {case_priority}</li><li>Status: {case_status}</li><li>Created Date: {case_created_date}</li></ul><p><strong>Description:</strong></p><p>{case_description}</p><p>Thank you for your support.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
            // Opportunity Created
            [
                'name' => 'Opportunity Created',
                'from' => 'Sales Team',
                'translations' => [
                    'en' => [
                        'subject' => 'New Opportunity Created - {opportunity_name}',
                        'content' => '<p>Hello {assigned_user_name},</p><p>A new sales opportunity has been created and assigned to you. Please review the details below and take appropriate action.</p><p><strong>Opportunity Details:</strong></p><ul><li>Opportunity Name: {opportunity_name}</li><li>Account: {account_name}</li><li>Contact: {contact_name}</li><li>Stage: {opportunity_stage}</li><li>Amount: {opportunity_amount}</li><li>Close Date: {opportunity_close_date}</li></ul><p><strong>Description:</strong></p><p>{opportunity_description}</p><p>Please log into the system to view full opportunity details and begin working on this sales opportunity.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
            // Opportunity Status Changed
            [
                'name' => 'Opportunity Status Changed',
                'from' => 'Sales Team',
                'translations' => [
                    'en' => [
                        'subject' => 'Opportunity Stage Updated - {opportunity_name}',
                        'content' => '<p>Hello {assigned_user_name},</p><p>The stage of your opportunity has been updated from <strong>{old_opportunity_stage}</strong> to <strong>{new_opportunity_stage}</strong>.</p><p><strong>Opportunity Details:</strong></p><ul><li>Opportunity Name: {opportunity_name}</li><li>Account: {account_name}</li><li>Contact: {contact_name}</li><li>Current Stage: {new_opportunity_stage}</li><li>Amount: {opportunity_amount}</li><li>Close Date: {opportunity_close_date}</li></ul><p><strong>Description:</strong></p><p>{opportunity_description}</p><p>Please continue working on this opportunity and update the progress as needed.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
                    ]
                ]
            ],
        ];

        foreach ($templates as $templateData) {
            $existingTemplate = EmailTemplate::where('name', $templateData['name'])->first();

            if ($existingTemplate) {
                continue;
            }

            $template = EmailTemplate::create([
                'name' => $templateData['name'],
                'from' => $templateData['from'],
                'user_id' => 1
            ]);

            foreach ($langCodes as $langCode) {
                $translation = $templateData['translations'][$langCode] ?? $templateData['translations']['en'];

                EmailTemplateLang::create([
                    'parent_id' => $template->id,
                    'lang' => $langCode,
                    'subject' => $translation['subject'],
                    'content' => $translation['content']
                ]);
            }

            UserEmailTemplate::create([
                'template_id' => $template->id,
                'user_id' => 1,
                'is_active' => true
            ]);
        }
    }
}
