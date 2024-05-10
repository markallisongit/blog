# Load SQL Server module
Import-Module SqlServer

# these variables are defined outside this script



# Connection string using SQL Server authentication
$connectionString = "Server=$($Server); Database=People; User ID=$($User); Password=$($Password);"

# Random FirstName, LastName, and Age generator
function Get-RandomPerson {
    $firstNames = @("Alice", "Bob", "Charlie", "David", "Eva")
    $lastNames = @("Smith", "Johnson", "Williams", "Jones", "Brown")
    $firstName = $firstNames | Get-Random
    $lastName = $lastNames | Get-Random
    $age = Get-Random -Minimum 18 -Maximum 100
    return ,$firstName, $lastName, $age
}

# Insert data
function Insert-Data {
    $firstName, $lastName, $age = Get-RandomPerson
    Invoke-Sqlcmd -ConnectionString $connectionString -Query "EXEC InsertPerson @FirstName='$firstName', @LastName='$lastName', @Age=$age"
}

# Update data
function Update-Data {
    $personID = Get-Random -Minimum 1 -Maximum 10 # Adjust range based on expected IDs
    $firstName, $lastName, $age = Get-RandomPerson
    Invoke-Sqlcmd -ConnectionString $connectionString -Query "EXEC UpdatePerson @PersonID=$personID, @FirstName='$firstName', @LastName='$lastName', @Age=$age"
}

# Delete data
function Delete-Data {
    $personID = Get-Random -Minimum 1 -Maximum 10 # Adjust range based on available IDs
    Invoke-Sqlcmd -ConnectionString $connectionString -Query "EXEC DeletePerson @PersonID=$personID"
}

# Infinite loop to perform operations
while ($true) {
    Insert-Data
    Start-Sleep -Milliseconds 100
    Update-Data
    Start-Sleep -Milliseconds 100
    Delete-Data
    Start-Sleep -Milliseconds 100
}
