---
title: "Test"
date: 2021-03-13T07:52:35Z
draft: true
author: "Mark"

---


{{< admonition info "Info" true >}}
Be very **careful** you don't accidentally drop a database.

It could be quite inconvenient for a lot of people.
{{< /admonition >}}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus, purus eu semper faucibus, orci mi dignissim nisi, at bibendum est massa ac justo. Donec id dictum nibh, ut commodo mi. Donec condimentum cursus nunc, a faucibus nunc consequat ullamcorper. Donec sed tempor orci, ut auctor ipsum. Maecenas sed augue nec neque cursus ultrices. Donec blandit augue et dolor eleifend semper. Duis faucibus orci sed elit sollicitudin dictum. In tincidunt libero in sapien laoreet rutrum. Cras vel nisi felis. Phasellus commodo in metus quis tempus. Praesent porta justo nec diam interdum, ut maximus dolor commodo. In ullamcorper, augue ut blandit aliquam, nisl lectus vehicula ipsum, vel feugiat massa tortor eget metus. Phasellus congue bibendum urna, eget facilisis est fermentum id. Sed volutpat tempor malesuada.

{{< admonition quote "|" true >}}
JFDI

*-- Nigel*
{{< /admonition >}}

## Github gist

{{< gist markallisongit 8087e644938a696cfdf21a3b55918a74 >}}

## GitHub gist 2

{{< gist markallisongit bc84666bfd744a94d3b314464868fd23 >}}

## markdown highlighter

``` PowerShell
[cmdletbinding()]
param (
    $SubscriptionName,
    $ResourceGroupName,
    $StorageAccountName,
    $ContainerName,
    $ExtensionToDelete
)

if ((Get-AzSubscription -SubscriptionName $SubscriptionName).State -ne 'Enabled') {
    Write-Verbose "Connecting to Azure subscription: $SubscriptionName"
    Connect-AzAccount -Subscription $SubscriptionName 
}

Set-AzContext -Subscription $SubscriptionName
Get-AzSubscription -SubscriptionName $SubscriptionName
$key = (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -Name $StorageAccountName | where {$_.KeyName -eq 'key1'}).Value
$context = New-AzStorageContext -StorageAccountName $StorageAccountName -StorageAccountKey $key
$blobs = Get-AzStorageBlob -Container $ContainerName -Context $context | where { $null -eq $_.SnapshotTime }
foreach($blob in $blobs) { 
    if ($blob.Name -match ".+\.$($ExtensionToDelete)") {
        Write-Output "Deleting $($blob.Name)"
        Remove-AzStorageBlob -Blob $blob.Name -Container $ContainerName -Context $context
    }
}
```


Aliquam nec orci in quam malesuada consequat. Nunc a lectus id odio commodo porta. Pellentesque quis purus nunc. Donec id metus eget mi tincidunt molestie. Donec ac dignissim velit. Praesent id urna orci. Maecenas lobortis augue id dui sagittis, in pharetra sapien porttitor. In eu risus ac dolor volutpat fermentum ut ac leo. Fusce hendrerit eros vestibulum urna volutpat rutrum eget sit amet ex. Integer sed metus nec dui egestas condimentum. Aliquam id varius tellus, ut lobortis sem. Quisque at vehicula nunc.

Donec ac turpis ac lorem varius varius eu non erat. Nullam rhoncus arcu metus, at mollis dui finibus eget. Aenean dictum lacinia massa non pellentesque. Sed malesuada ex felis, ut fermentum quam tincidunt ut. Nulla efficitur, neque id pulvinar efficitur, orci augue gravida massa, vitae bibendum sapien nisl euismod dolor. Cras non ipsum porta, venenatis nunc vitae, condimentum quam. Sed fermentum lorem magna, non efficitur nulla dapibus ac. Vivamus vehicula, odio sed auctor sagittis, purus erat cursus felis, ut tincidunt leo eros sit amet ipsum.

Donec malesuada ac felis eu volutpat. Sed eleifend eget sem id lacinia. Pellentesque fringilla tincidunt ex, finibus interdum metus vulputate quis. Aliquam erat volutpat. Quisque pellentesque sodales maximus. Curabitur et leo a lectus consectetur maximus. Nam elit est, posuere in viverra rutrum, laoreet vel felis. Quisque id nisi nec purus ornare varius. Fusce luctus porttitor dolor in pellentesque. Fusce ac odio blandit, interdum nisl lacinia, pellentesque metus.

Duis risus nulla, bibendum nec massa congue, pharetra facilisis libero. Curabitur non efficitur libero. Donec placerat ultrices dolor, eu blandit est eleifend at. Duis molestie, orci quis dictum semper, sem diam pulvinar quam, et hendrerit nisi urna rutrum enim. In lobortis egestas magna, in blandit tellus tincidunt vitae. Phasellus lacinia consequat nunc quis faucibus. Nunc risus lectus, lobortis sit amet pulvinar non, placerat ac ante. Maecenas porttitor magna a suscipit efficitur. Etiam dapibus finibus maximus. Quisque hendrerit aliquet scelerisque. Vivamus iaculis fringilla leo, non pharetra ligula fringilla sit amet. Maecenas fermentum nunc et hendrerit ultrices. Sed finibus placerat purus vitae eleifend.