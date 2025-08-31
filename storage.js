// Unified storage adapter (Supabase-first)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_UPLOADS_BUCKET = process.env.SUPABASE_UPLOADS_BUCKET || 'uploads';
const SUPABASE_BACKUPS_BUCKET = process.env.SUPABASE_BACKUPS_BUCKET || 'backups';

function getSupabase() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function uploadFile(userId, fileName, fileBuffer, contentType) {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    const path = `users/${userId}/${fileName}`;
    const { error: uploadError } = await supabase
        .storage
        .from(SUPABASE_UPLOADS_BUCKET)
        .upload(path, fileBuffer, { contentType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: signed, error: signedErr } = await supabase
        .storage
        .from(SUPABASE_UPLOADS_BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signedErr) throw signedErr;

    return {
        fileName,
        url: signed?.signedUrl || null,
        path,
        bucket: SUPABASE_UPLOADS_BUCKET,
        message: 'File uploaded successfully'
    };
}

async function deleteFile(userId, fileName) {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase Storage not configured.');
    }
    const path = `users/${userId}/${fileName}`;
    const { error } = await supabase
        .storage
        .from(SUPABASE_UPLOADS_BUCKET)
        .remove([path]);
    if (error) throw error;
    return { message: 'File deleted successfully' };
}

async function createBackup(userId, payloadObject) {
    const supabase = getSupabase();
    if (!supabase) {
        throw new Error('Supabase Storage not configured.');
    }
    const fileName = `backup-${userId}-${Date.now()}.json`;
    const path = `user-backups/${fileName}`;
    const buffer = Buffer.from(JSON.stringify(payloadObject ?? {}, null, 2));
    const { error } = await supabase
        .storage
        .from(SUPABASE_BACKUPS_BUCKET)
        .upload(path, buffer, { contentType: 'application/json', upsert: true });
    if (error) throw error;
    return { backupId: fileName, path, bucket: SUPABASE_BACKUPS_BUCKET, message: 'Backup created successfully' };
}

module.exports = {
    uploadFile,
    deleteFile,
    createBackup,
};






