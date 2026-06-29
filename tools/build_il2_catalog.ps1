$ErrorActionPreference = 'Stop'

$installRoot = 'C:\Program Files\IL2Series\game\data'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$outputRoot = Join-Path $workspaceRoot 'catalog'

if (-not (Test-Path $installRoot)) {
    throw "Install root not found: $installRoot"
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$missionFiles = @(
    (Join-Path $installRoot 'Missions\[DEMO]BlackThursday.Mission'),
    (Join-Path $installRoot 'Missions\[DEMO]InchonStrike.Mission'),
    (Join-Path $installRoot 'Missions\_gen.Mission'),
    (Join-Path $installRoot 'Multiplayer\Dogfight\_test_dogfight_IL-3.Mission')
) | Where-Object { Test-Path -LiteralPath $_ }

$objectTypes = @(
    'Plane',
    'Vehicle',
    'Ship',
    'Block',
    'Bridge',
    'Airfield',
    'Effect',
    'Ground'
)

function Normalize-Category {
    param(
        [string]$scriptPath,
        [string]$objectType,
        [string]$previewName
    )

    $sample = @($scriptPath, $previewName, $objectType) -join ' '
    $sampleLower = $sample.ToLowerInvariant()

    if ($objectType -eq 'Plane' -or $sampleLower -match 'worldobjects\\planes\\|b29|c47|f51|f80|f84|f86|il10|la11|li2|mig15|tu2|yak9|simpleb29|simpleyak') { return 'aircraft' }
    if ($objectType -eq 'Ship' -or $sampleLower -match 'worldobjects\\ships\\') { return 'naval' }
    if ($objectType -eq 'Airfield' -or $sampleLower -match 'worldobjects\\airfields\\|fakefield|windsock|ndb') { return 'airfield' }
    if ($objectType -eq 'Bridge' -or $sampleLower -match 'worldobjects\\bridges\\|bridge_|br_') { return 'bridge' }
    if ($sampleLower -match 'fixedobjects\\|bofors|ks19|ks12|61k|72k|aaa|mortar|zis3|zpu|dshk|m1aaa|m2aaa|m1919|m2cal50|s60|bm37|ml20|ancps|antps|ge1942a|p8|rp15') { return 'fixed_weapon' }
    if ($objectType -eq 'Vehicle' -or $sampleLower -match 'worldobjects\\vehicles\\|ba64|gaz|gmc|studebaker|willys|dodge|t34|is2|isu|su76|m4a3|m46|m16-mgmc|m19|m3a1|m6-tractor|t66') { return 'ground_vehicle' }
    if ($objectType -eq 'Ground') { return 'ground_spawn' }
    if ($objectType -eq 'Effect' -or $sampleLower -match 'fire|effect') { return 'effect' }
    if ($sampleLower -match 'blocksdetail_statics\\|static_train_|static_equipment_|static_munition_|static_plane_') { return 'static_target' }
    if ($sampleLower -match 'worldobjects\\blocksdetail\\|worldobjects\\blocks\\|kor_|mil_|ind_|port_|arf_|rw_|factory|warehouse|apartment|hospital|school|office|stores|tent|barrack|tank|barrels') { return 'static_target' }

    return 'unknown'
}

function Normalize-HistoricalFaction {
    param(
        [string]$name,
        [string]$scriptPath
    )

    $sample = @($name, $scriptPath) -join ' '
    $sampleLower = $sample.ToLowerInvariant()

    if ($sampleLower -match 'f86|f84|f80|f51|b29|c47|libertyship|gleaves|bofors|m4a3|m46|m16-mgmc|gmc|willys|dodge|ancps|antps|m1aaa|m2aaa') { return 'UN/US-aligned' }
    if ($sampleLower -match 'mig15|yak9|yak9p|yak9s1|la11|li2|tu2|il10|t34|isu|is2|su76|studebaker|gaz|zis3|zpu|dshk|61k|72k|ks19|ks12|type475') { return 'DPRK/PRC/Soviet-aligned' }
    if ($sampleLower -match 'kor_|mil_|ind_|port_|bridge_|br_|rw_|arf_|factory|warehouse|hospital|school|office|stores|apartment|static_train_|static_equipment_|static_munition_|static_plane_|blocksdetail_statics') { return 'terrain/static' }

    return 'unknown'
}

function Get-LeafBase {
    param([string]$path)

    if ([string]::IsNullOrWhiteSpace($path)) {
        return $null
    }

    return [System.IO.Path]::GetFileNameWithoutExtension($path)
}

function Normalize-LandscapeGroupCategory {
    param(
        [string]$sourceFile,
        [string]$groupPath,
        [string]$objectType
    )

    $sample = @($sourceFile, $groupPath, $objectType) -join ' '
    $sampleLower = $sample.ToLowerInvariant()

    if ($sampleLower -match 'airfields') { return 'airfield_zone' }
    if ($sampleLower -match 'bridgesrailroad') { return 'rail_bridge' }
    if ($sampleLower -match 'bridgesroad') { return 'road_bridge' }
    if ($sampleLower -match 'cities') { return 'city_zone' }
    if ($sampleLower -match 'dams') { return 'dam_zone' }
    if ($sampleLower -match 'industry_ports|industrial') { return 'industrial_port_zone' }
    if ($sampleLower -match 'militarycamps|military_camp') { return 'military_camp_zone' }
    if ($sampleLower -match 'mines') { return 'mine_zone' }
    if ($sampleLower -match 'railwaystations|rw_station') { return 'railway_station_zone' }
    if ($sampleLower -match 'tunnels|tunnel') { return 'tunnel_zone' }
    if ($sampleLower -match 'fullscene|marks') { return 'landscape_marker_zone' }

    return 'landscape_zone'
}

function Parse-LandscapeGroupFile {
    param([string]$path)

    $lines = Get-Content -LiteralPath $path
    $stack = New-Object System.Collections.ArrayList
    $pending = $null
    $results = New-Object System.Collections.Generic.List[object]

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $trim = $lines[$i].Trim()

        if ($trim -match '^(Group|Bridge|Block|Ground|MCU_Waypoint|Vehicle|Plane|Airfield)$') {
            $pending = [ordered]@{
                type = $Matches[1]
                Name = $null
                Index = $null
                Script = $null
                Model = $null
                XPos = $null
                YPos = $null
                ZPos = $null
            }
            continue
        }

        if ($trim -eq '{' -and $pending) {
            [void]$stack.Add($pending)
            $pending = $null
            continue
        }

        if ($stack.Count -gt 0) {
            $top = $stack[$stack.Count - 1]
            if (-not $top.Name -and $trim -match '^Name\s*=\s*"([^"]+)"') { $top.Name = $Matches[1] }
            if (-not $top.Index -and $trim -match '^Index\s*=\s*([0-9-]+)') { $top.Index = [int]$Matches[1] }
            if (-not $top.Script -and $trim -match '^Script\s*=\s*"([^"]+)"') { $top.Script = $Matches[1] }
            if (-not $top.Model -and $trim -match '^Model\s*=\s*"([^"]+)"') { $top.Model = $Matches[1] }
            if ($null -eq $top.XPos -and $trim -match '^XPos\s*=\s*(-?[0-9.]+)') { $top.XPos = [double]$Matches[1] }
            if ($null -eq $top.YPos -and $trim -match '^YPos\s*=\s*(-?[0-9.]+)') { $top.YPos = [double]$Matches[1] }
            if ($null -eq $top.ZPos -and $trim -match '^ZPos\s*=\s*(-?[0-9.]+)') { $top.ZPos = [double]$Matches[1] }
        }

        if ($trim -eq '}') {
            if ($stack.Count -eq 0) {
                continue
            }

            $closed = $stack[$stack.Count - 1]
            $stack.RemoveAt($stack.Count - 1)

            if ($closed.type -eq 'Group') {
                continue
            }

            $groupStack = @($stack | Where-Object { $_.type -eq 'Group' -and $_.Name })
            $groupPathParts = @($groupStack | ForEach-Object { $_.Name })
            $groupPathText = $groupPathParts -join ' > '
            $sourceFile = [System.IO.Path]::GetFileName($path)

            $results.Add([pscustomobject]@{
                source_file = $sourceFile
                source_path = $path
                root_group = if ($groupPathParts.Count -gt 0) { $groupPathParts[0] } else { $null }
                group_path = $groupPathText
                group_name = if ($groupPathParts.Count -gt 0) { $groupPathParts[-1] } else { $null }
                parent_group = if ($groupPathParts.Count -gt 1) { $groupPathParts[-2] } else { $null }
                object_type = $closed.type
                object_name = $closed.Name
                object_index = $closed.Index
                script_path = $closed.Script
                model_path = $closed.Model
                x = $closed.XPos
                y = $closed.YPos
                z = $closed.ZPos
                category = Normalize-LandscapeGroupCategory -sourceFile $sourceFile -groupPath $groupPathText -objectType $closed.type
                historical_faction_guess = Normalize-HistoricalFaction -name $groupPathText -scriptPath $closed.Script
            })
        }
    }

    return $results
}

function Parse-MissionObjects {
    param([string]$path)

    $lines = Get-Content -LiteralPath $path
    $results = New-Object System.Collections.Generic.List[object]

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()
        if ($objectTypes -notcontains $line) {
            continue
        }

        $blockType = $line
        $blockStart = $i + 1

        while ($blockStart -lt $lines.Count -and $lines[$blockStart].Trim() -ne '{') {
            $blockStart++
        }

        if ($blockStart -ge $lines.Count) {
            continue
        }

        $depth = 0
        $buffer = New-Object System.Collections.Generic.List[string]
        for ($j = $blockStart; $j -lt $lines.Count; $j++) {
            $current = $lines[$j]
            $buffer.Add($current)
            if ($current.Trim() -eq '{') { $depth++ }
            if ($current.Trim() -eq '}') {
                $depth--
                if ($depth -eq 0) {
                    $record = [ordered]@{
                        mission_path = $path
                        object_type = $blockType
                        line_number = $i + 1
                        script_path = $null
                        model_path = $null
                        display_name = $null
                        country = $null
                    }

                    foreach ($entry in $buffer) {
                        if (-not $record.display_name -and $entry -match '^\s*Name\s*=\s*"([^"]+)"') {
                            $record.display_name = $Matches[1]
                        }
                        if (-not $record.script_path -and $entry -match '^\s*Script\s*=\s*"([^"]+)"') {
                            $record.script_path = $Matches[1]
                        }
                        if (-not $record.model_path -and $entry -match '^\s*Model\s*=\s*"([^"]+)"') {
                            $record.model_path = $Matches[1]
                        }
                        if (-not $record.country -and $entry -match '^\s*Country\s*=\s*([0-9-]+)') {
                            $record.country = [int]$Matches[1]
                        }
                    }

                    $results.Add([pscustomobject]$record)
                    $i = $j
                    break
                }
            }
        }
    }

    return $results
}

$missionObjects = foreach ($missionFile in $missionFiles) {
    Parse-MissionObjects -path $missionFile
}

$groupedMissionObjects = $missionObjects |
    Where-Object { $_.script_path -or $_.model_path } |
    Group-Object object_type, script_path, model_path

$catalog = foreach ($group in $groupedMissionObjects) {
    $first = $group.Group[0]
    $scriptLeaf = if ($first.script_path) { Get-LeafBase $first.script_path } else { $null }
    [pscustomobject]@{
        key = ($group.Name -replace ', ', '|')
        object_type = $first.object_type
        category = Normalize-Category -scriptPath $first.script_path -objectType $first.object_type -previewName $scriptLeaf
        display_name = $first.display_name
        script_path = $first.script_path
        model_path = $first.model_path
        source_count = $group.Count
        source_missions = @($group.Group.mission_path | Sort-Object -Unique)
        source_lines = @($group.Group | Select-Object -First 10 | ForEach-Object { "$($_.mission_path):$($_.line_number)" })
        countries = @($group.Group.country | Where-Object { $_ -ne $null } | Sort-Object -Unique)
        historical_faction_guess = Normalize-HistoricalFaction -name $first.display_name -scriptPath $first.script_path
    }
}

$previewNames = Get-ChildItem (Join-Path $installRoot 'GUI\preview') -File |
    Select-Object -ExpandProperty BaseName |
    Sort-Object -Unique

$knownByLeaf = @{}
foreach ($item in $catalog) {
    if ($item.script_path) {
        $leaf = (Get-LeafBase $item.script_path).ToLowerInvariant()
        if (-not $knownByLeaf.ContainsKey($leaf)) {
            $knownByLeaf[$leaf] = @()
        }
        $knownByLeaf[$leaf] += $item
    }
}

$previewCatalog = foreach ($previewName in $previewNames) {
    $lookup = $previewName.ToLowerInvariant()
    $matched = @()
    if ($knownByLeaf.ContainsKey($lookup)) {
        $matched = $knownByLeaf[$lookup]
    }

    [pscustomobject]@{
        preview_name = $previewName
        matched_catalog_entries = @($matched.key | Sort-Object -Unique)
        inferred_category = if ($matched.Count -gt 0) {
            ($matched | Select-Object -First 1).category
        } else {
            Normalize-Category -scriptPath '' -objectType '' -previewName $previewName
        }
        historical_faction_guess = if ($matched.Count -gt 0) {
            ($matched | Select-Object -First 1).historical_faction_guess
        } else {
            Normalize-HistoricalFaction -name $previewName -scriptPath ''
        }
        present_in_mission_examples = [bool]($matched.Count -gt 0)
    }
}

$multiplayerPlaneConfigs = @()
$dogfightMission = Join-Path $installRoot 'Multiplayer\Dogfight\_test_dogfight_IL-3.Mission'
if (Test-Path -LiteralPath $dogfightMission) {
    $multiplayerPlaneConfigs = Select-String -Path $dogfightMission -Pattern 'MultiplayerPlaneConfig = "([^"]+)"' |
        ForEach-Object { $_.Matches[0].Groups[1].Value } |
        Sort-Object -Unique
}

$referenceCatalog = New-Object System.Collections.Generic.List[object]

foreach ($planeConfig in $multiplayerPlaneConfigs) {
    $leaf = (Get-LeafBase $planeConfig)
    $referenceCatalog.Add([pscustomobject]@{
        source_type = 'multiplayer_plane_config'
        asset_name = $leaf
        object_type = 'Plane'
        category = 'aircraft'
        script_path = $planeConfig
        model_path = $null
        historical_faction_guess = Normalize-HistoricalFaction -name $leaf -scriptPath $planeConfig
        present_in_mission_examples = [bool]($knownByLeaf.ContainsKey($leaf.ToLowerInvariant()))
    })
}

foreach ($preview in ($previewCatalog | Where-Object { -not $_.present_in_mission_examples })) {
    $referenceCatalog.Add([pscustomobject]@{
        source_type = 'preview_only'
        asset_name = $preview.preview_name
        object_type = $null
        category = $preview.inferred_category
        script_path = $null
        model_path = $null
        historical_faction_guess = $preview.historical_faction_guess
        present_in_mission_examples = $false
    })
}

$missionLimits = @{}
Get-Content (Join-Path $installRoot 'GUI\MissionObjectsMaxCount.cfg') | ForEach-Object {
    if ($_ -match '^\s*([A-Z]+)\s*=\s*([0-9]+)') {
        $missionLimits[$Matches[1]] = [int]$Matches[2]
    }
}

$landscapeTemplates = @()
$currentLandscape = $null
foreach ($line in Get-Content (Join-Path $installRoot 'GUI\me_generic_templates.ini')) {
    if ($line -match '^\[(LANDSCAPE_[^\]]+)\]') {
        $currentLandscape = [ordered]@{
            landscape = $Matches[1]
            hmap = $null
            textures = $null
            forests = $null
            guimap = $null
            season_prefix = $null
            temperature = $null
            date = $null
        }
        $landscapeTemplates += [pscustomobject]$currentLandscape
        continue
    }
    if (-not $currentLandscape) { continue }
    if ($line -match '^\s*HMap\s*=\s*"([^"]+)"') { $landscapeTemplates[-1].hmap = $Matches[1] }
    if ($line -match '^\s*Textures\s*=\s*"([^"]+)"') { $landscapeTemplates[-1].textures = $Matches[1] }
    if ($line -match '^\s*Forests\s*=\s*"([^"]+)"') { $landscapeTemplates[-1].forests = $Matches[1] }
    if ($line -match '^\s*GuiMap\s*=\s*"([^"]+)"') { $landscapeTemplates[-1].guimap = $Matches[1] }
    if ($line -match '^\s*SeasonPrefix\s*=\s*"([^"]+)"') { $landscapeTemplates[-1].season_prefix = $Matches[1] }
    if ($line -match '^\s*Temperature\s*=\s*([0-9-]+)') { $landscapeTemplates[-1].temperature = [int]$Matches[1] }
    if ($line -match '^\s*Date\s*=\s*"([^"]+)"') { $landscapeTemplates[-1].date = $Matches[1] }
}

$generatorLabels = Get-Content (Join-Path $installRoot 'Missions\_gen.eng') |
    Where-Object { $_ -match '^[0-9]+:' } |
    ForEach-Object {
        $parts = $_ -split ':', 2
        [pscustomobject]@{
            id = [int]$parts[0]
            text = $parts[1]
        }
    }

$landscapeGroupFiles = Get-ChildItem -Path $outputRoot -Filter 'landscape_Korea_*.Group' -File | Sort-Object Name

$landscapeObjectCatalog = foreach ($groupFile in $landscapeGroupFiles) {
    Parse-LandscapeGroupFile -path $groupFile.FullName
}

$landscapeGroupCatalog = $landscapeObjectCatalog |
    Group-Object source_file, group_path, group_name, parent_group, root_group, category, historical_faction_guess |
    ForEach-Object {
        $first = $_.Group[0]
        $objects = $_.Group
        $scriptPaths = @($objects.script_path | Where-Object { $_ } | Sort-Object -Unique)
        $modelPaths = @($objects.model_path | Where-Object { $_ } | Sort-Object -Unique)
        $objectTypeCounts = $objects |
            Group-Object object_type |
            Sort-Object Name |
            ForEach-Object { "{0}:{1}" -f $_.Name, $_.Count }

        [pscustomobject]@{
            source_file = $first.source_file
            root_group = $first.root_group
            group_path = $first.group_path
            group_name = $first.group_name
            parent_group = $first.parent_group
            category = $first.category
            historical_faction_guess = $first.historical_faction_guess
            object_count = $objects.Count
            object_types = $objectTypeCounts
            representative_scripts = $scriptPaths
            representative_models = $modelPaths
            center_x = [math]::Round((($objects | Where-Object { $null -ne $_.x } | Measure-Object -Property x -Average).Average), 3)
            center_y = [math]::Round((($objects | Where-Object { $null -ne $_.y } | Measure-Object -Property y -Average).Average), 3)
            center_z = [math]::Round((($objects | Where-Object { $null -ne $_.z } | Measure-Object -Property z -Average).Average), 3)
            min_x = ($objects | Where-Object { $null -ne $_.x } | Measure-Object -Property x -Minimum).Minimum
            max_x = ($objects | Where-Object { $null -ne $_.x } | Measure-Object -Property x -Maximum).Maximum
            min_z = ($objects | Where-Object { $null -ne $_.z } | Measure-Object -Property z -Minimum).Minimum
            max_z = ($objects | Where-Object { $null -ne $_.z } | Measure-Object -Property z -Maximum).Maximum
        }
    } |
    Sort-Object category, source_file, group_path

$output = [ordered]@{
    generated_at = (Get-Date).ToString('s')
    install_root = $installRoot
    mission_files = $missionFiles
    mission_object_catalog = $catalog | Sort-Object category, object_type, script_path
    preview_catalog = $previewCatalog
    reference_catalog = $referenceCatalog
    mission_limits = $missionLimits
    landscape_templates = $landscapeTemplates
    landscape_object_catalog = $landscapeObjectCatalog
    landscape_group_catalog = $landscapeGroupCatalog
    generator_labels = $generatorLabels
}

$jsonPath = Join-Path $outputRoot 'il2_korea_catalog.json'
$landscapeObjectsJsonPath = Join-Path $outputRoot 'il2_korea_landscape_objects.json'
$landscapeGroupsJsonPath = Join-Path $outputRoot 'il2_korea_landscape_groups.json'
$csvPath = Join-Path $outputRoot 'il2_korea_catalog.csv'
$previewCsvPath = Join-Path $outputRoot 'il2_korea_preview_catalog.csv'
$referenceCsvPath = Join-Path $outputRoot 'il2_korea_reference_catalog.csv'
$landscapeObjectCsvPath = Join-Path $outputRoot 'il2_korea_landscape_objects.csv'
$landscapeGroupCsvPath = Join-Path $outputRoot 'il2_korea_landscape_groups.csv'
$summaryPath = Join-Path $outputRoot 'README.md'

$mainOutput = [ordered]@{
    generated_at = $output.generated_at
    install_root = $output.install_root
    mission_files = $output.mission_files
    mission_object_catalog = $output.mission_object_catalog
    preview_catalog = $output.preview_catalog
    reference_catalog = $output.reference_catalog
    mission_limits = $output.mission_limits
    landscape_templates = $output.landscape_templates
    generator_labels = $output.generator_labels
    landscape_data_files = [ordered]@{
        object_json = 'il2_korea_landscape_objects.json'
        group_json = 'il2_korea_landscape_groups.json'
        object_csv = 'il2_korea_landscape_objects.csv'
        group_csv = 'il2_korea_landscape_groups.csv'
    }
}

$mainOutput | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8
$landscapeObjectCatalog | ConvertTo-Json -Depth 6 | Set-Content -Path $landscapeObjectsJsonPath -Encoding UTF8
$landscapeGroupCatalog | ConvertTo-Json -Depth 6 | Set-Content -Path $landscapeGroupsJsonPath -Encoding UTF8

$catalog |
    Select-Object category, object_type, display_name, script_path, model_path, source_count, historical_faction_guess,
        @{ Name = 'countries'; Expression = { ($_.countries -join ',') } },
        @{ Name = 'source_missions'; Expression = { ($_.source_missions -join '; ') } } |
    Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$previewCatalog |
    Select-Object preview_name, inferred_category, historical_faction_guess, present_in_mission_examples,
        @{ Name = 'matched_catalog_entries'; Expression = { ($_.matched_catalog_entries -join '; ') } } |
    Export-Csv -Path $previewCsvPath -NoTypeInformation -Encoding UTF8

$referenceCatalog |
    Select-Object source_type, asset_name, object_type, category, script_path, model_path, historical_faction_guess, present_in_mission_examples |
    Export-Csv -Path $referenceCsvPath -NoTypeInformation -Encoding UTF8

$landscapeObjectCatalog |
    Select-Object source_file, root_group, group_path, group_name, parent_group, category, historical_faction_guess,
        object_type, object_name, object_index, script_path, model_path, x, y, z |
    Export-Csv -Path $landscapeObjectCsvPath -NoTypeInformation -Encoding UTF8

$landscapeGroupCatalog |
    Select-Object source_file, root_group, group_path, group_name, parent_group, category, historical_faction_guess,
        object_count, center_x, center_y, center_z, min_x, max_x, min_z, max_z,
        @{ Name = 'object_types'; Expression = { ($_.object_types -join '; ') } },
        @{ Name = 'representative_scripts'; Expression = { ($_.representative_scripts -join '; ') } },
        @{ Name = 'representative_models'; Expression = { ($_.representative_models -join '; ') } } |
    Export-Csv -Path $landscapeGroupCsvPath -NoTypeInformation -Encoding UTF8

$catalogByCategory = $catalog | Group-Object category | Sort-Object Name
$referenceBySource = $referenceCatalog | Group-Object source_type | Sort-Object Name
$landscapeGroupsByCategory = $landscapeGroupCatalog | Group-Object category | Sort-Object Name
$summaryLines = New-Object System.Collections.Generic.List[string]
$summaryLines.Add('# IL-2 Korea Local Catalog')
$summaryLines.Add('')
$summaryLines.Add("Generated from installed mission/config data under `C:\Program Files\IL2Series\game\data`.")
$summaryLines.Add('')
$summaryLines.Add('## Outputs')
$summaryLines.Add('')
$summaryLines.Add("- `il2_korea_catalog.json`: full structured catalog")
$summaryLines.Add("- `il2_korea_catalog.csv`: flattened mission-derived object catalog")
$summaryLines.Add("- `il2_korea_preview_catalog.csv`: editor preview names and inferred categories")
$summaryLines.Add("- `il2_korea_reference_catalog.csv`: known aircraft configs and preview-only references")
$summaryLines.Add("- `il2_korea_landscape_objects.json`: full direct landscape object dataset")
$summaryLines.Add("- `il2_korea_landscape_groups.json`: grouped landscape zone dataset")
$summaryLines.Add("- `il2_korea_landscape_objects.csv`: direct objects parsed from developer landscape group files")
$summaryLines.Add("- `il2_korea_landscape_groups.csv`: grouped landscape zones aggregated from developer landscape files")
$summaryLines.Add('')
$summaryLines.Add('## Mission-Derived Categories')
$summaryLines.Add('')
foreach ($group in $catalogByCategory) {
    $summaryLines.Add("- $($group.Name): $($group.Count)")
}
$summaryLines.Add('')
$summaryLines.Add('## Reference Sources')
$summaryLines.Add('')
foreach ($group in $referenceBySource) {
    $summaryLines.Add("- $($group.Name): $($group.Count)")
}
$summaryLines.Add('')
$summaryLines.Add('## Landscape Group Categories')
$summaryLines.Add('')
foreach ($group in $landscapeGroupsByCategory) {
    $summaryLines.Add("- $($group.Name): $($group.Count)")
}
$summaryLines.Add('')
$summaryLines.Add('## Landscape Templates')
$summaryLines.Add('')
foreach ($landscape in $landscapeTemplates) {
    $summaryLines.Add("- $($landscape.landscape): date $($landscape.date), temp $($landscape.temperature), season $($landscape.season_prefix)")
}
$summaryLines.Add('')
$summaryLines.Add('## Editor Limits')
$summaryLines.Add('')
foreach ($entry in $missionLimits.GetEnumerator() | Sort-Object Name) {
    $summaryLines.Add("- $($entry.Name): $($entry.Value)")
}

Set-Content -Path $summaryPath -Value $summaryLines -Encoding UTF8

Write-Host "Catalog written to $outputRoot"
