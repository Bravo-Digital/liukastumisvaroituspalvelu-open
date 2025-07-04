import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { warningsTable, warningDetailsTable } from '@/lib/schema';
import { eq, and, lte, gte, inArray, desc } from 'drizzle-orm';

// Helper function to parse query parameters
function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Pagination parameters
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 items
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
  
  // Filter parameters
  const languages = searchParams.get('languages')?.split(',').filter(Boolean) || [];
  const severities = searchParams.get('severities')?.split(',').filter(Boolean) || [];
  
  return { limit, offset, languages, severities };
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const { limit, offset, languages, severities } = parseQueryParams(request);
    
    // Build where conditions - always include time filter for active warnings
    const whereConditions = [
      and(
        lte(warningsTable.onsetAt, now),
        gte(warningsTable.expiresAt, now)
      )
    ];
    
    if (severities.length > 0) {
      whereConditions.push(inArray(warningsTable.severity, severities));
    }
    
    if (languages.length > 0) {
      whereConditions.push(inArray(warningDetailsTable.lang, languages));
    }
    
    // Build the query with filters first, then ordering
    let query = db
      .select()
      .from(warningsTable)
      .leftJoin(warningDetailsTable, eq(warningsTable.id, warningDetailsTable.warningId));
    
    // Apply filters - whereConditions will always have at least the time filter
    query = query.where(and(...whereConditions));
    
    // Get all filtered results first
    const allWarnings = await query.orderBy(desc(warningsTable.severity), desc(warningsTable.onsetAt));
    
    // Process results into unique warnings
    const warningsMap = new Map();
    
    allWarnings.forEach(row => {
      const warning = row.warnings;
      const detail = row.warning_details;
      
      if (!warningsMap.has(warning.id)) {
        warningsMap.set(warning.id, {
          id: warning.id,
          effectiveAt: warning.onsetAt,
          expiresAt: warning.expiresAt,
          severity: warning.severity,
          createdAt: warning.createdAt,
          details: []
        });
      }
      
      if (detail) {
        // Filter details by language if specified
        if (languages.length === 0 || languages.includes(detail.lang)) {
          warningsMap.get(warning.id).details.push({
            language: detail.lang,
            headline: detail.headline,
            description: detail.description,
            locations: detail.location,
            event: detail.event
          });
        }
      }
    });

    // Convert to array and apply pagination on unique warnings
    const allUniqueWarnings = Array.from(warningsMap.values());
    const paginatedWarnings = allUniqueWarnings.slice(offset, offset + limit);
    
    return NextResponse.json({
      warnings: paginatedWarnings,
      pagination: {
        total: allUniqueWarnings.length,
        limit,
        offset,
        hasMore: offset + limit < allUniqueWarnings.length
      }
    });
  } catch (error) {
    console.error('Error fetching active warnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active warnings' },
      { status: 500 }
    );
  }
}