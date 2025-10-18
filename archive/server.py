#!/usr/bin/env python3
"""
Cardiology Suite HTTP Server
Ensures index.html is always served as the default page
"""
import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class CardiologyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        
        # If requesting root directory, serve index.html
        if parsed_path.path == '/' or parsed_path.path == '':
            self.path = '/index.html'
        
        # Call the parent class to handle the request
        return super().do_GET()
    
    def end_headers(self):
        # Add cache control headers for development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server(port=8080):
    """Start the Cardiology Suite server"""
    # Ensure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("ERROR: index.html not found in current directory!")
        sys.exit(1)
    
    with socketserver.TCPServer(("", port), CardiologyHTTPRequestHandler) as httpd:
        print(f"🏥 Cardiology Suite server running at http://localhost:{port}")
        print(f"📁 Serving from: {os.getcwd()}")
        print("🔄 Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    start_server()