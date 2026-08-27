<?php

namespace App\Console\Commands;

use App\Services\ImapService;
use Illuminate\Console\Command;

class FetchEmailsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:fetch';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch new incoming emails from IMAP inbox';

    /**
     * Execute the console command.
     */
    public function handle(ImapService $imapService)
    {
        $this->info('Fetching new emails via IMAP...');
        $count = $imapService->fetchNewEmails();
        $this->info("Successfully fetched {$count} new email(s).");
    }
}
