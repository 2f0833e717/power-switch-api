Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WinAPI {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

# 現在アクティブなウィンドウのハンドル取得
$hwnd = [WinAPI]::GetForegroundWindow()

# 6 = 最小化
$result = [WinAPI]::ShowWindow($hwnd, 6)

if ($result) {
    Write-Output "SUCCESS"
} else {
    Write-Output "FAILED"
}

